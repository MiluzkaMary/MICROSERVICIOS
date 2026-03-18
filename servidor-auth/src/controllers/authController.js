/**
 * Controlador de Autenticación
 * Maneja las peticiones HTTP relacionadas con autenticación
 */
const authService = require('../services/authService');
const { validarLogin, validarRecuperacion, validarReset } = require('../validators/authValidator');
const { createErrorResponse, ERROR_CODES } = require('../utils/errorHandler');

class AuthController {
  /**
   * POST /auth/login
   * Login de usuario
   */
  async login(req, res) {
    try {
      // Validar entrada
      const { error, value } = validarLogin(req.body);
      if (error) {
        const errorResponse = createErrorResponse(
          400,
          error.details[0].message,
          ERROR_CODES.VALIDATION_ERROR,
          req.originalUrl,
          req.method
        );
        return res.status(400).json(errorResponse);
      }

      const { email, password } = value;
      const resultado = await authService.login(email, password);

      // Login exitoso devuelve 200 OK
      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error en login:', error);
      
      // Determinar código y mensaje apropiado
      let statusCode = error.status || 500;
      let code = ERROR_CODES.INTERNAL_ERROR;
      let message = error.message || 'Error al iniciar sesión';
      
      if (error.status === 401) {
        code = ERROR_CODES.INVALID_CREDENTIALS;
      } else if (error.status === 403) {
        code = ERROR_CODES.USER_INACTIVE;
      }
      
      const errorResponse = createErrorResponse(
        statusCode,
        message,
        code,
        req.originalUrl,
        req.method
      );
      
      res.status(statusCode).json(errorResponse);
    }
  }

  /**
   * POST /auth/recover-password
   * Solicitar recuperación de contraseña
   */
  async recoverPassword(req, res) {
    try {
      // Validar entrada
      const { error, value } = validarRecuperacion(req.body);
      if (error) {
        const errorResponse = createErrorResponse(
          400,
          error.details[0].message,
          ERROR_CODES.VALIDATION_ERROR,
          req.originalUrl,
          req.method
        );
        return res.status(400).json(errorResponse);
      }

      const { email } = value;
      const resultado = await authService.solicitarRecuperacion(email);

      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error en recover-password:', error);
      
      let statusCode = error.status || 500;
      let code = ERROR_CODES.INTERNAL_ERROR;
      let message = error.message || 'Error al solicitar recuperación';
      
      if (error.status === 404) {
        code = ERROR_CODES.USER_NOT_FOUND;
      } else if (error.status === 403) {
        code = ERROR_CODES.USER_INACTIVE;
      }
      
      const errorResponse = createErrorResponse(
        statusCode,
        message,
        code,
        req.originalUrl,
        req.method
      );
      
      res.status(statusCode).json(errorResponse);
    }
  }

  /**
   * POST /auth/reset-password
   * Establecer nueva contraseña con token
   */
  async resetPassword(req, res) {
    try {
      // Validar entrada
      const { error, value } = validarReset(req.body);
      if (error) {
        const errorResponse = createErrorResponse(
          400,
          error.details[0].message,
          ERROR_CODES.VALIDATION_ERROR,
          req.originalUrl,
          req.method
        );
        return res.status(400).json(errorResponse);
      }

      const { token, nuevaPassword } = value;
      const resultado = await authService.resetPassword(token, nuevaPassword);

      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error en reset-password:', error);
      
      let statusCode = error.status || 500;
      let code = ERROR_CODES.INTERNAL_ERROR;
      let message = error.message || 'Error al establecer contraseña';
      
      if (error.status === 404) {
        code = ERROR_CODES.TOKEN_INVALID;
        message = 'Token inválido o expirado';
      } else if (error.status === 400) {
        code = ERROR_CODES.TOKEN_EXPIRED;
      } else if (error.status === 403) {
        code = ERROR_CODES.USER_INACTIVE;
      }
      
      const errorResponse = createErrorResponse(
        statusCode,
        message,
        code,
        req.originalUrl,
        req.method
      );
      
      res.status(statusCode).json(errorResponse);
    }
  }
}

module.exports = new AuthController();
