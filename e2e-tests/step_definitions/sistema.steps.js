const { When } = require('@cucumber/cucumber');

When('intento iniciar sesion por el gateway con credenciales invalidas', async function () {
  const respuesta = await this.http.post('/auth/login', {
    email: 'inexistente@empresa.com',
    password: 'incorrecta123'
  });

  this.response = {
    status: respuesta.status,
    data: respuesta.data,
    headers: respuesta.headers
  };
});