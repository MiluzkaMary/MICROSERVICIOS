/**
 * Utilidades para manejo centralizado de errores
 * Estructura estándar de respuestas de error HTTP
 */

/**
 * Códigos de error de la aplicación
 */
const ERROR_CODES = {
  // Autenticación (401)
  TOKEN_MISSING: 'TOKEN_MISSING',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Autorización (403)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Cliente (400)
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // Recursos (404)
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  
  // Conflictos (409)
  CONFLICT: 'CONFLICT',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  
  // Servidor (500, 503)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR'
};

/**
 * Nombres de error HTTP estándar
 */
const HTTP_ERROR_NAMES = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  500: 'Internal Server Error',
  503: 'Service Unavailable'
};

/**
 * Crea una respuesta de error estándar
 * 
 * @param {number} statusCode - Código HTTP (400, 401, 403, 404, 500, etc.)
 * @param {string} message - Mensaje descriptivo del error
 * @param {string} code - Código de error de aplicación (TOKEN_EXPIRED, FORBIDDEN, etc.)
 * @param {string} path - Ruta del endpoint que generó el error
 * @param {string} method - Método HTTP (GET, POST, PUT, DELETE)
 * @param {Array} errors - Array de errores de validación (opcional)
 * @returns {object} Respuesta de error estándar
 */
function createErrorResponse(statusCode, message, code, path, method, errors = null) {
  const response = {
    success: false,
    statusCode,
    error: HTTP_ERROR_NAMES[statusCode] || 'Error',
    message,
    code,
    path,
    method,
    timestamp: new Date().toISOString()
  };

  // Agregar errores de validación si existen
  if (errors && Array.isArray(errors) && errors.length > 0) {
    response.errors = errors;
  }

  return response;
}

/**
 * Middleware global de manejo de errores
 * Debe ser el último middleware en app.js
 * 
 * @param {Error} err - Error capturado
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 * @param {Function} next - Next function
 */
function globalErrorHandler(err, req, res, next) {
  console.error('❌ Error capturado por globalErrorHandler:', err);

  // Determinar código de estado
  const statusCode = err.statusCode || err.status || 500;
  
  // Determinar código de error
  const code = err.code || ERROR_CODES.INTERNAL_ERROR;
  
  // Determinar mensaje
  const message = err.message || 'Ha ocurrido un error inesperado';

  // Crear respuesta estándar
  const errorResponse = createErrorResponse(
    statusCode,
    message,
    code,
    req.originalUrl || req.url,
    req.method,
    err.errors || null
  );

  return res.status(statusCode).json(errorResponse);
}

/**
 * Middleware para manejar rutas no encontradas (404)
 * Debe colocarse después de todas las rutas
 */
function notFoundHandler(req, res, next) {
  const errorResponse = createErrorResponse(
    404,
    `La ruta ${req.method} ${req.originalUrl} no existe`,
    ERROR_CODES.NOT_FOUND,
    req.originalUrl,
    req.method
  );

  return res.status(404).json(errorResponse);
}

module.exports = {
  ERROR_CODES,
  HTTP_ERROR_NAMES,
  createErrorResponse,
  globalErrorHandler,
  notFoundHandler
};
