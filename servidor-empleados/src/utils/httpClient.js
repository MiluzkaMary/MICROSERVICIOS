/**
 * Cliente HTTP para comunicación entre microservicios
 * Implementa timeout, reintentos y manejo de errores
 */
const http = require('http');

/**
 * Realiza una petición HTTP GET con timeout y reintentos
 * @param {string} url - URL completa del endpoint
 * @param {Object} options - Opciones de configuración
 * @param {number} options.timeout - Timeout en milisegundos (default: 3000)
 * @param {number} options.retries - Número de reintentos (default: 2)
 * @param {number} options.retryDelay - Delay entre reintentos en ms (default: 500)
 * @returns {Promise<Object>} Respuesta con { statusCode, data, ok }
 */
async function httpGet(url, options = {}) {
  const {
    timeout = 3000,
    retries = 2,
    retryDelay = 500
  } = options;

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Reintento ${attempt}/${retries} para ${url}`);
        await sleep(retryDelay);
      }

      const result = await makeHttpRequest(url, timeout);
      return result;
    } catch (error) {
      lastError = error;
      console.error(`Intento ${attempt + 1} falló:`, error.message);

      // Si es el último intento, lanzar el error
      if (attempt === retries) {
        throw lastError;
      }
    }
  }

  throw lastError;
}

/**
 * Realiza la petición HTTP GET con timeout
 * @private
 */
function makeHttpRequest(url, timeout) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      timeout: timeout,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Empleados-Service/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : null;
          resolve({
            statusCode: res.statusCode,
            data: parsedData,
            ok: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (error) {
          reject(new Error(`Error parseando respuesta JSON: ${error.message}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout después de ${timeout}ms`));
    });

    req.on('error', (error) => {
      reject(new Error(`Error de red: ${error.message}`));
    });

    req.end();
  });
}

/**
 * Utilidad para esperar (sleep)
 * @private
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  httpGet
};
