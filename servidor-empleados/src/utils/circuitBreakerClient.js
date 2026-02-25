/**
 * Circuit Breaker para comunicación entre microservicios
 * Implementa el patrón Circuit Breaker usando Opossum para prevenir fallos en cascada
 */
const CircuitBreaker = require('opossum');
const { httpGet } = require('./httpClient');

/**
 * Configuración del Circuit Breaker
 */
const circuitBreakerOptions = {
  timeout: 10000, // Timeout de 10 segundos (permite reintentos de httpGet)
  errorThresholdPercentage: 50, // Si el 50% de las llamadas fallan, abre el circuito
  resetTimeout: 10000, // Después de 10 segundos, intenta cerrar el circuito (estado half-open)
  rollingCountTimeout: 10000, // Ventana de tiempo para calcular estadísticas (10 segundos)
  rollingCountBuckets: 10, // Número de buckets para la ventana deslizante
  name: 'departamentos-service-breaker', // Nombre del circuito
  volumeThreshold: 3, // Mínimo de llamadas antes de evaluar si abrir el circuito
  enabled: true, // Circuit breaker habilitado
};

/**
 * Función de fallback cuando el circuito está abierto
 * IMPORTANTE: Solo se ejecuta automáticamente cuando el circuito está ABIERTO
 */
const fallbackFunction = (url, options, error) => {
  console.warn(`⚠️ CIRCUIT BREAKER ABIERTO - Fallback activado para: ${url}`);
  console.warn(`Razón: ${error ? error.message : 'Circuito abierto'}`);
  return {
    statusCode: 503,
    data: null,
    ok: false,
    circuitBreakerOpen: true,
    message: 'Servicio temporalmente no disponible. Circuit Breaker activado.'
  };
};

/**
 * Crea el circuit breaker para llamadas GET
 */
const circuitBreaker = new CircuitBreaker(httpGet, circuitBreakerOptions);

// Configurar función de fallback
circuitBreaker.fallback(fallbackFunction);

/**
 * Event Listeners para monitoreo y logging
 */

// Cuando el circuito se abre (demasiados fallos)
circuitBreaker.on('open', () => {
  console.error('🔴 CIRCUIT BREAKER ABIERTO - Demasiados fallos detectados');
});

// Cuando el circuito se cierra (servicio recuperado)
circuitBreaker.on('close', () => {
  console.info('🟢 CIRCUIT BREAKER CERRADO - Servicio recuperado');
});

// Cuando el circuito está en estado half-open (probando si el servicio se recuperó)
circuitBreaker.on('halfOpen', () => {
  console.warn('🟡 CIRCUIT BREAKER HALF-OPEN - Probando recuperación del servicio');
});

// Cuando una llamada es exitosa
circuitBreaker.on('success', (result) => {
  console.debug('✅ Circuit Breaker - Llamada exitosa');
});

// Cuando una llamada falla
circuitBreaker.on('failure', (error) => {
  console.error('❌ Circuit Breaker - Llamada fallida:', error.message);
});

// Cuando se ejecuta el fallback
circuitBreaker.on('fallback', (result) => {
  console.warn('⚠️ Circuit Breaker - Fallback ejecutado');
});

// Cuando ocurre un timeout
circuitBreaker.on('timeout', () => {
  console.error('⏱️ Circuit Breaker - Timeout detectado');
});

// Cuando se rechaza una llamada porque el circuito está abierto
circuitBreaker.on('reject', () => {
  console.warn('🚫 Circuit Breaker - Llamada rechazada (circuito abierto)');
});

/**
 * Wrapper para hacer llamadas GET con Circuit Breaker
 * @param {string} url - URL del endpoint
 * @param {Object} options - Opciones de configuración
 * @returns {Promise<Object>} Respuesta con { statusCode, data, ok }
 */
async function httpGetWithCircuitBreaker(url, options = {}) {
  // El Circuit Breaker maneja automáticamente:
  // - Ejecución de la función (httpGet)
  // - Conteo de éxitos/fallos
  // - Apertura del circuito cuando errorThreshold se alcanza
  // - Ejecución del fallback cuando el circuito está abierto
  return await circuitBreaker.fire(url, options);
}

/**
 * Obtiene las estadísticas del Circuit Breaker
 * @returns {Object} Estadísticas y estado actual
 */
function getCircuitBreakerStats() {
  const stats = circuitBreaker.stats;
  return {
    name: circuitBreakerOptions.name,
    state: circuitBreaker.opened ? 'OPEN' : 
           circuitBreaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
    stats: {
      successes: stats.successes,
      failures: stats.failures,
      fallbacks: stats.fallbacks,
      timeouts: stats.timeouts,
      rejects: stats.rejects,
      fires: stats.fires,
      latencyMean: stats.latencyMean,
      percentiles: stats.percentiles
    },
    config: {
      timeout: circuitBreakerOptions.timeout,
      errorThresholdPercentage: circuitBreakerOptions.errorThresholdPercentage,
      resetTimeout: circuitBreakerOptions.resetTimeout,
      volumeThreshold: circuitBreakerOptions.volumeThreshold
    }
  };
}

module.exports = {
  httpGetWithCircuitBreaker,
  getCircuitBreakerStats,
  circuitBreaker
};
