const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert/strict');

When('consulto la lista de empleados sin token', async function () {
  const respuesta = await this.http.get('/empleados');

  this.response = {
    status: respuesta.status,
    data: respuesta.data,
    headers: respuesta.headers
  };
});

When('consulto la lista de empleados', async function () {
  const respuesta = await this.http.get('/empleados', {
    headers: { Authorization: `Bearer ${this.token}` }
  });

  this.response = {
    status: respuesta.status,
    data: respuesta.data,
    headers: respuesta.headers
  };
});

When('uso un token invalido para consultar empleados', async function () {
  const respuesta = await this.http.get('/empleados', {
    headers: { Authorization: 'Bearer token.invalido.fake' }
  });

  this.response = {
    status: respuesta.status,
    data: respuesta.data,
    headers: respuesta.headers
  };
});

When('intento crear un empleado con rol USER', async function () {
  const payload = {
    nombre: 'Usuario De Prueba',
    email: `user-${Date.now()}@empresa.com`,
    departamentoId: '1',
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

When('intento eliminar un empleado con rol USER', async function () {
  const respuesta = await this.http.delete('/empleados/EMP-USER-TEST', {
    headers: { Authorization: `Bearer ${this.token}` }
  });

  this.response = {
    status: respuesta.status,
    data: respuesta.data,
    headers: respuesta.headers
  };
});

When('creo un departamento de prueba', async function () {
  const payload = {
    nombre: `Seguridad-${Date.now()}`,
    descripcion: 'Departamento temporal para pruebas BDD'
  };

  const respuesta = await this.http.post('/departamentos', payload, {
    headers: { Authorization: `Bearer ${this.token}` }
  });

  this.response = {
    status: respuesta.status,
    data: respuesta.data,
    headers: respuesta.headers
  };

  if (respuesta.status === 201) {
    this.lastCreatedDepartamento = respuesta.data;
  }
});

Given('que estoy autenticado como {string}', async function (rol) {
  await this.autenticarComo(rol);
});

Then('la respuesta debe tener codigo {int}', function (codigo) {
  assert.ok(this.response, 'No existe respuesta previa para validar');
  assert.equal(this.response.status, codigo, `Se esperaba ${codigo} y se obtuvo ${this.response.status}`);
});