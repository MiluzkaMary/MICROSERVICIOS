const path = require('path');
const { setWorldConstructor } = require('@cucumber/cucumber');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

class ProyectoWorld {
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:8085';

    this.adminCredentials = {
      email: process.env.ADMIN_EMAIL || '',
      password: process.env.ADMIN_PASSWORD || ''
    };

    this.userCredentials = {
      email: process.env.USER_EMAIL || '',
      password: process.env.USER_PASSWORD || ''
    };

    this.token = null;
    this.response = null;
    this.lastCreatedEmpleado = null;
    this.lastCreatedDepartamento = null;
    this.lastRecoveryToken = null;

    // axios no debe lanzar excepciones por respuestas HTTP esperadas (401, 403, 404, etc.).
    this.http = axios.create({
      baseURL: this.baseUrl,
      validateStatus: () => true
    });
  }

  async autenticarComo(rol) {
    const credentials = String(rol).toUpperCase() === 'ADMIN'
      ? this.adminCredentials
      : this.userCredentials;

    const respuesta = await this.http.post('/auth/login', credentials);
    this.response = {
      status: respuesta.status,
      data: respuesta.data,
      headers: respuesta.headers
    };

    if (respuesta.status !== 200 || !respuesta.data || !respuesta.data.token) {
      throw new Error(`No fue posible autenticar como ${rol}. Respuesta: ${JSON.stringify(respuesta.data)}`);
    }

    this.token = respuesta.data.token;
    return respuesta.data;
  }
}

setWorldConstructor(ProyectoWorld);