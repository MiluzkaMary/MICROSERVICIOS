const path = require('path');
const { setWorldConstructor } = require('@cucumber/cucumber');
const axios = require('axios');
const dotenv = require('dotenv');
const { esperarHastaQue } = require('./polling');

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

    const respuesta = await esperarHastaQue(async () => {
      try {
        const current = await this.http.post('/auth/login', credentials);

        if (current.status === 200 && current.data && current.data.token) {
          return current;
        }

        if ([502, 503, 504].includes(current.status)) {
          throw new Error(`Gateway no listo (${current.status})`);
        }

        throw new Error(`No fue posible autenticar como ${rol}. Respuesta: ${JSON.stringify(current.data)}`);
      } catch (error) {
        if (error.response && [502, 503, 504].includes(error.response.status)) {
          throw new Error(`Gateway no listo (${error.response.status})`);
        }

        throw error;
      }
    }, {
      maxIntentos: process.env.AUTH_LOGIN_MAX_ATTEMPTS,
      intervaloMs: process.env.AUTH_LOGIN_INTERVAL_MS
    });

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