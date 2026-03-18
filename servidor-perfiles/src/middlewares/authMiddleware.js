/**
 * Middleware de autenticación JWT
 * Verifica token y extrae información del usuario
 */
const jwt = require('jsonwebtoken');
const { createErrorResponse, ERROR_CODES } = require('../utils/errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-cambiar-en-produccion';

/**
 * Middleware para requerir autenticación
 * Valida JWT y añade usuario al request
 */
function requiereAuth(req, res, next) {
  try {
    // Extraer token del header Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const errorResponse = createErrorResponse(
        401,
        'Token de autenticación no proporcionado. Incluya el header Authorization: Bearer <token>',
        ERROR_CODES.TOKEN_MISSING,
        req.originalUrl || req.url,
        req.method
      );
      return res.status(401).json(errorResponse);
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar y decodificar token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Añadir información del usuario al request
    req.usuario = {
      empleadoId: decoded.sub,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Error en autenticación:', error.message);
    
    // Diferenciar entre token expirado y token inválido
    let message, code;
    
    if (error.name === 'TokenExpiredError') {
      message = 'El token ha expirado. Inicia sesión nuevamente.';
      code = ERROR_CODES.TOKEN_EXPIRED;
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Token inválido o malformado.';
      code = ERROR_CODES.TOKEN_INVALID;
    } else {
      message = 'Error al validar el token de autenticación.';
      code = ERROR_CODES.UNAUTHORIZED;
    }
    
    const errorResponse = createErrorResponse(
      401,
      message,
      code,
      req.originalUrl || req.url,
      req.method
    );
    
    return res.status(401).json(errorResponse);
  }
}

/**
 * Middleware para requerir rol ADMIN
 * Debe usarse DESPUÉS de requiereAuth
 */
function requiereAdmin(req, res, next) {
  if (!req.usuario) {
    const errorResponse = createErrorResponse(
      401,
      'No autenticado. Debe iniciar sesión primero.',
      ERROR_CODES.UNAUTHORIZED,
      req.originalUrl || req.url,
      req.method
    );
    return res.status(401).json(errorResponse);
  }

  if (req.usuario.role !== 'ADMIN') {
    const errorResponse = createErrorResponse(
      403,
      'Acceso denegado. Este endpoint requiere permisos de administrador.',
      ERROR_CODES.INSUFFICIENT_PERMISSIONS,
      req.originalUrl || req.url,
      req.method
    );
    return res.status(403).json(errorResponse);
  }

  next();
}

module.exports = {
  requiereAuth,
  requiereAdmin
};
