const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert/strict');
const { v4: uuidv4 } = require('uuid');
const { esperarHastaQue } = require('../support/polling');

function crearEmailUnico() {
  // UUID evita colisiones entre escenarios y mantiene aisladas las pruebas funcionales.
  return `test-${uuidv4()}@empresa.com`;
}

async function crearDepartamentoDePrueba(world) {
  const payload = {
    nombre: `ONB-${uuidv4()}`,
    descripcion: 'Departamento de pruebas para onboarding'
  };

  const respuesta = await world.http.post('/departamentos', payload, {
    headers: { Authorization: `Bearer ${world.token}` }
  });

  if (respuesta.status !== 201) {
    throw new Error(`No fue posible crear el departamento de onboarding: ${JSON.stringify(respuesta.data)}`);
  }

  world.lastCreatedDepartamento = respuesta.data;
  return respuesta.data;
}

async function crearEmpleadoOnboarding(world, overrides = {}) {
  if (!world.lastCreatedDepartamento) {
    await crearDepartamentoDePrueba(world);
  }

  const email = overrides.email || crearEmailUnico();
  const payload = {
    nombre: overrides.nombre || 'Empleado Onboarding',
    email,
    departamentoId: overrides.departamentoId || String(world.lastCreatedDepartamento.id),
    fechaIngreso: overrides.fechaIngreso || '2026-01-01'
  };

  const respuesta = await world.http.post('/empleados', payload, {
    headers: { Authorization: `Bearer ${world.token}` }
  });

  world.response = {
    status: respuesta.status,
    data: respuesta.data,
    headers: respuesta.headers
  };

  if (respuesta.status !== 201) {
    throw new Error(`No fue posible crear el empleado de onboarding: ${JSON.stringify(respuesta.data)}`);
  }

  world.lastCreatedEmpleado = {
    ...respuesta.data,
    email,
    nuevaPassword: overrides.nuevaPassword || 'Rabbit123'
  };

  return world.lastCreatedEmpleado;
}

async function consultarNotificacionesEmpleado(world, empleadoId) {
  const respuesta = await world.http.get(`/notificaciones/${empleadoId}`, {
    headers: { Authorization: `Bearer ${world.token}` }
  });

  world.response = {
    status: respuesta.status,
    data: respuesta.data,
    headers: respuesta.headers
  };

  return respuesta;
}

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
    const asunto = (headers.Subject || []).join(' ');
    return destinatarios.includes(email) || asunto.toLowerCase().includes('recuperacion') || asunto.toLowerCase().includes('activa');
  });

  if (!correo) {
    throw new Error(`No se encontro correo para ${email}`);
  }

  let body = [
    correo.Content && correo.Content.Body,
    correo.Raw && correo.Raw.Data,
    correo.MIME && correo.MIME.Body
  ].filter(Boolean).join('\n');

  // MailHog puede entregar quoted-printable con saltos suaves "=\r\n" que rompen el JWT.
  body = body
    .replace(/=\r?\n/g, '')
    .replace(/=3D/g, '=');

  const match = body.match(/Token:\s*([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/);
  if (!match) {
    throw new Error('No se pudo extraer el token de recuperacion del correo');
  }

  return match[1];
}

Given('que existe un departamento de prueba', async function () {
  if (!this.token) {
    await this.autenticarComo('ADMIN');
  }

  await crearDepartamentoDePrueba(this);
});

When('creo un empleado de onboarding', async function () {
  if (!this.token) {
    await this.autenticarComo('ADMIN');
  }

  await crearEmpleadoOnboarding(this);
});

When('intento crear un empleado con departamento inexistente', async function () {
  const payload = {
    nombre: 'Empleado Invalido',
    email: crearEmailUnico(),
    departamentoId: '999999',
    fechaIngreso: '2026-01-01'
  };

  const respuesta = await this.http.post('/empleados', payload, {
    headers: { Authorization: `Bearer ${this.token}` }
  });

  this.response = {
    status: respuesta.status,
    data: respuesta.data,
    headers: respuesta.headers
  };
});

When('intento crear un empleado con nombre {string}, email {string}, departamentoId {string} y fechaIngreso {string}', async function (nombre, email, departamentoId, fechaIngreso) {
  const payload = {};

  if (nombre) payload.nombre = nombre;
  if (email) payload.email = email;
  if (departamentoId) payload.departamentoId = departamentoId;
  if (fechaIngreso) payload.fechaIngreso = fechaIngreso;

  const respuesta = await this.http.post('/empleados', payload, {
    headers: { Authorization: `Bearer ${this.token}` }
  });

  this.response = {
    status: respuesta.status,
    data: respuesta.data,
    headers: respuesta.headers
  };
});

Then('eventualmente el servicio de auth debe tener un usuario para el empleado creado', async function () {
  assert.ok(this.lastCreatedEmpleado, 'No existe un empleado creado para verificar auth');

  await esperarHastaQue(async () => {
    const respuesta = await consultarNotificacionesEmpleado(this, this.lastCreatedEmpleado.id);
    const items = respuesta.data && respuesta.data.data ? respuesta.data.data : respuesta.data;
    return Array.isArray(items) && items.length > 0;
  });

  assert.equal(this.response.status, 200);
});

Then('eventualmente debe existir una notificacion para el empleado creado', async function () {
  assert.ok(this.lastCreatedEmpleado, 'No existe un empleado creado para verificar notificaciones');

  await esperarHastaQue(async () => {
    const respuesta = await consultarNotificacionesEmpleado(this, this.lastCreatedEmpleado.id);
    const items = respuesta.data && respuesta.data.data ? respuesta.data.data : respuesta.data;
    return Array.isArray(items) && items.length > 0;
  });

  assert.equal(this.response.status, 200);
});

When('solicito la recuperacion de contraseña para el empleado creado', async function () {
  assert.ok(this.lastCreatedEmpleado, 'No existe un empleado creado para solicitar recuperacion');

  const respuesta = await this.http.post('/auth/recover-password', {
    email: this.lastCreatedEmpleado.email
  });

  this.response = {
    status: respuesta.status,
    data: respuesta.data,
    headers: respuesta.headers
  };
});

Then('eventualmente debo obtener el token de recuperacion del empleado creado', async function () {
  assert.ok(this.lastCreatedEmpleado, 'No existe un empleado creado para recuperar token');

  await esperarHastaQue(async () => {
    const respuesta = await consultarNotificacionesEmpleado(this, this.lastCreatedEmpleado.id);
    const items = respuesta.data && respuesta.data.data ? respuesta.data.data : respuesta.data;
    return Array.isArray(items) && items.some((item) => String(item.tipo).toUpperCase() === 'RECUPERACION');
  });

  // No usamos sleep fijo: polling termina apenas aparece el correo con token válido.
  this.lastRecoveryToken = await esperarHastaQue(async () => {
    try {
      return await obtenerTokenDesdeMailhog(this.lastCreatedEmpleado.email);
    } catch (error) {
      return false;
    }
  });
  assert.ok(this.lastRecoveryToken, 'No fue posible extraer el token de recuperacion');
});

When('restablezco la contraseña del empleado creado', async function () {
  assert.ok(this.lastRecoveryToken, 'No existe token de recuperacion disponible');

  const respuesta = await this.http.post('/auth/reset-password', {
    token: this.lastRecoveryToken,
    nuevaPassword: this.lastCreatedEmpleado.nuevaPassword
  });

  this.response = {
    status: respuesta.status,
    data: respuesta.data,
    headers: respuesta.headers
  };
});

Then('el empleado puede iniciar sesion correctamente', async function () {
  assert.ok(this.lastCreatedEmpleado, 'No existe empleado para validar login');

  const respuesta = await this.http.post('/auth/login', {
    email: this.lastCreatedEmpleado.email,
    password: this.lastCreatedEmpleado.nuevaPassword
  });

  this.response = {
    status: respuesta.status,
    data: respuesta.data,
    headers: respuesta.headers
  };

  assert.equal(respuesta.status, 200);
  assert.ok(respuesta.data.token, 'El login no devolvio token');
});