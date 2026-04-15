const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert/strict');
const { esperarHastaQue } = require('../support/polling');
const { v4: uuidv4 } = require('uuid');

async function obtenerTokenDesdeMailhog(email) {
  const mailhogBaseUrl = process.env.MAILHOG_URL || 'http://localhost:8025';
  const respuesta = await fetch(`${mailhogBaseUrl}/api/v2/messages`);

  if (!respuesta.ok) {
    throw new Error(`No se pudo consultar MailHog en ${mailhogBaseUrl}`);
  }

  const payload = await respuesta.json();
  const items = payload.items || [];
  const correo = items.find((item) => {
    const headers = item.Content && item.Content.Headers ? item.Content.Headers : {};
    const destinatarios = (headers.To || []).join(' ');
    return destinatarios.includes(email);
  });

  if (!correo) {
    throw new Error('No se encontro correo de recuperacion para el empleado activo');
  }

  let body = [
    correo.Content && correo.Content.Body,
    correo.Raw && correo.Raw.Data
  ].filter(Boolean).join('\n');

  body = body
    .replace(/=\r?\n/g, '')
    .replace(/=3D/g, '=');

  const match = body.match(/Token:\s*([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/);
  if (!match) {
    throw new Error('No se pudo extraer el token de recuperacion para el offboarding');
  }

  return match[1];
}

async function crearEmpleadoActivoConCredenciales(world) {
  if (!world.token) {
    await world.autenticarComo('ADMIN');
  }

  if (!world.lastCreatedDepartamento) {
    const respuestaDepartamento = await world.http.post('/departamentos', {
      nombre: `OFF-${uuidv4()}`,
      descripcion: 'Departamento temporal para offboarding'
    }, {
      headers: { Authorization: `Bearer ${world.token}` }
    });

    if (respuestaDepartamento.status !== 201) {
      throw new Error(`No fue posible crear el departamento de offboarding: ${JSON.stringify(respuestaDepartamento.data)}`);
    }

    world.lastCreatedDepartamento = respuestaDepartamento.data;
  }

  const email = `test-${uuidv4()}@empresa.com`;
  const respuestaEmpleado = await world.http.post('/empleados', {
    id: `EMP-${uuidv4()}`,
    nombre: 'Empleado Offboarding',
    email,
    departamentoId: String(world.lastCreatedDepartamento.id),
    fechaIngreso: '2026-01-01'
  }, {
    headers: { Authorization: `Bearer ${world.token}` }
  });

  if (respuestaEmpleado.status !== 201) {
    throw new Error(`No fue posible crear el empleado para offboarding: ${JSON.stringify(respuestaEmpleado.data)}`);
  }

  world.lastCreatedEmpleado = {
    ...respuestaEmpleado.data,
    email,
    nuevaPassword: 'Rabbit123'
  };

  await esperarHastaQue(async () => {
    const respuesta = await world.http.get(`/notificaciones/${world.lastCreatedEmpleado.id}`, {
      headers: { Authorization: `Bearer ${world.token}` }
    });
    const items = respuesta.data && respuesta.data.data ? respuesta.data.data : respuesta.data;
    return Array.isArray(items) && items.length > 0;
  });

  const recoveryResponse = await world.http.post('/auth/recover-password', {
    email: world.lastCreatedEmpleado.email
  });

  if (recoveryResponse.status !== 200) {
    throw new Error(`No fue posible solicitar recuperacion para el empleado activo: ${JSON.stringify(recoveryResponse.data)}`);
  }

  await esperarHastaQue(async () => {
    const respuesta = await world.http.get(`/notificaciones/${world.lastCreatedEmpleado.id}`, {
      headers: { Authorization: `Bearer ${world.token}` }
    });
    const items = respuesta.data && respuesta.data.data ? respuesta.data.data : respuesta.data;
    return Array.isArray(items) && items.some((item) => String(item.tipo).toUpperCase() === 'RECUPERACION');
  });

  world.lastRecoveryToken = await esperarHastaQue(async () => {
    try {
      return await obtenerTokenDesdeMailhog(world.lastCreatedEmpleado.email);
    } catch (error) {
      return false;
    }
  });

  const resetResponse = await world.http.post('/auth/reset-password', {
    token: world.lastRecoveryToken,
    nuevaPassword: world.lastCreatedEmpleado.nuevaPassword
  });

  if (resetResponse.status !== 200) {
    throw new Error(`No fue posible establecer la contraseña del empleado activo: ${JSON.stringify(resetResponse.data)}`);
  }

  const loginResponse = await world.http.post('/auth/login', {
    email: world.lastCreatedEmpleado.email,
    password: world.lastCreatedEmpleado.nuevaPassword
  });

  if (loginResponse.status !== 200) {
    throw new Error(`No fue posible dejar listo el empleado con credenciales: ${JSON.stringify(loginResponse.data)}`);
  }

  world.response = {
    status: loginResponse.status,
    data: loginResponse.data,
    headers: loginResponse.headers
  };

  world.token = loginResponse.data.token;
}

Given('que existe un empleado activo con credenciales configuradas', async function () {
  await crearEmpleadoActivoConCredenciales(this);
});

When('el administrador desvincula al empleado', async function () {
  assert.ok(this.lastCreatedEmpleado, 'No existe empleado para desvincular');

  // Fuerza credenciales ADMIN para evitar que el token de usuario del setup se reutilice por accidente.
  await this.autenticarComo('ADMIN');

  const respuesta = await this.http.delete(`/empleados/${this.lastCreatedEmpleado.id}`, {
    headers: { Authorization: `Bearer ${this.token}` }
  });

  this.response = {
    status: respuesta.status,
    data: respuesta.data,
    headers: respuesta.headers
  };
});

Then('eventualmente debe existir una notificacion de desvinculacion', async function () {
  assert.ok(this.lastCreatedEmpleado, 'No existe empleado para validar desvinculacion');

  await esperarHastaQue(async () => {
    const respuesta = await this.http.get(`/notificaciones/${this.lastCreatedEmpleado.id}`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });

    const items = respuesta.data && respuesta.data.data ? respuesta.data.data : respuesta.data;
    return Array.isArray(items) && items.some((item) => String(item.tipo).toUpperCase() === 'DESVINCULACION');
  });

  assert.equal(this.response.status, 200);
});

When('el empleado intenta hacer login', async function () {
  assert.ok(this.lastCreatedEmpleado, 'No existe empleado para probar login');

  const respuesta = await esperarHastaQue(async () => {
    const intento = await this.http.post('/auth/login', {
      email: this.lastCreatedEmpleado.email,
      password: this.lastCreatedEmpleado.nuevaPassword
    });

    if (intento.status === 403 || intento.status === 401) {
      return intento;
    }

    return false;
  });

  this.response = {
    status: respuesta.status,
    data: respuesta.data,
    headers: respuesta.headers
  };
});

When('solicito recuperacion de contraseña para el empleado desvinculado', async function () {
  assert.ok(this.lastCreatedEmpleado, 'No existe empleado para solicitar recuperacion');

  const respuesta = await esperarHastaQue(async () => {
    const intento = await this.http.post('/auth/recover-password', {
      email: this.lastCreatedEmpleado.email
    });

    if (intento.status === 403 || intento.status === 404 || intento.status === 400) {
      return intento;
    }

    return false;
  });

  this.response = {
    status: respuesta.status,
    data: respuesta.data,
    headers: respuesta.headers
  };
});