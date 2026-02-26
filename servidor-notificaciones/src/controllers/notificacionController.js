/**
 * Controlador para operaciones de Notificaciones
 */
const notificacionService = require('../services/notificacionService');
const NotificacionValidator = require('../validators/notificacionValidator');

class NotificacionController {
  /**
   * GET /notificaciones
   * Lista todas las notificaciones registradas
   */
  async listarNotificaciones(req, res) {
    try {
      const resultado = await notificacionService.obtenerTodas();
      return res.status(resultado.statusCode).json(resultado);
    } catch (error) {
      console.error('Error en listarNotificaciones:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Error al listar notificaciones',
        errors: [error.message]
      });
    }
  }

  /**
   * GET /notificaciones/:empleadoId
   * Lista notificaciones de un empleado específico
   */
  async listarPorEmpleado(req, res) {
    try {
      const { empleadoId } = req.params;

      // Validar empleadoId
      const validacion = NotificacionValidator.validarEmpleadoId(empleadoId);
      if (!validacion.valido) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'empleadoId inválido',
          errors: validacion.errores
        });
      }

      const resultado = await notificacionService.obtenerPorEmpleado(empleadoId);
      return res.status(resultado.statusCode).json(resultado);
    } catch (error) {
      console.error('Error en listarPorEmpleado:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Error al listar notificaciones del empleado',
        errors: [error.message]
      });
    }
  }

  /**
   * GET /notificaciones/estadisticas/resumen
   * Obtiene estadísticas generales de notificaciones
   */
  async obtenerEstadisticas(req, res) {
    try {
      const resultado = await notificacionService.obtenerEstadisticas();
      return res.status(resultado.statusCode).json(resultado);
    } catch (error) {
      console.error('Error en obtenerEstadisticas:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Error al obtener estadísticas',
        errors: [error.message]
      });
    }
  }

  /**
   * POST /notificaciones/evento/empleado-creado
   * Endpoint interno para recibir evento de empleado creado
   * En el futuro será reemplazado por RabbitMQ
   */
  async manejarEmpleadoCreado(req, res) {
    try {
      const { empleadoId, nombre, email } = req.body;

      // Validar datos del evento
      const validacion = NotificacionValidator.validarEventoEmpleadoCreado(req.body);
      if (!validacion.valido) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Datos del evento inválidos',
          errors: validacion.errores
        });
      }

      const resultado = await notificacionService.procesarEmpleadoCreado(empleadoId, nombre, email);
      return res.status(resultado.statusCode).json(resultado);
    } catch (error) {
      console.error('Error en manejarEmpleadoCreado:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Error al procesar evento de empleado creado',
        errors: [error.message]
      });
    }
  }

  /**
   * POST /notificaciones/evento/empleado-desvinculado
   * Endpoint interno para recibir evento de empleado desvinculado
   * En el futuro será reemplazado por RabbitMQ
   */
  async manejarEmpleadoDesvinculado(req, res) {
    try {
      const { empleadoId, nombre, email, motivo } = req.body;

      // Validar datos del evento
      const validacion = NotificacionValidator.validarEventoEmpleadoDesvinculado(req.body);
      if (!validacion.valido) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Datos del evento inválidos',
          errors: validacion.errores
        });
      }

      const resultado = await notificacionService.procesarEmpleadoDesvinculado(
        empleadoId, 
        nombre, 
        email, 
        motivo
      );
      return res.status(resultado.statusCode).json(resultado);
    } catch (error) {
      console.error('Error en manejarEmpleadoDesvinculado:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Error al procesar evento de empleado desvinculado',
        errors: [error.message]
      });
    }
  }
}

module.exports = new NotificacionController();
