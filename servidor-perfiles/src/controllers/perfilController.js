/**
 * Controlador para operaciones de Perfiles
 */
const perfilService = require('../services/perfilService');
const PerfilValidator = require('../validators/perfilValidator');

class PerfilController {
  /**
   * GET /perfiles/:empleadoId
   * Obtiene el perfil de un empleado específico
   */
  async obtenerPerfil(req, res) {
    try {
      const { empleadoId } = req.params;

      // Validar empleadoId
      const validacion = PerfilValidator.validarEmpleadoId(empleadoId);
      if (!validacion.valido) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Datos inválidos',
          errors: validacion.errores
        });
      }

      const resultado = await perfilService.obtenerPerfilPorEmpleadoId(empleadoId);

      return res.status(resultado.statusCode).json(resultado);
    } catch (error) {
      console.error('Error en obtenerPerfil:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Error al obtener el perfil',
        errors: [error.message]
      });
    }
  }

  /**
   * GET /perfiles
   * Obtiene todos los perfiles
   */
  async listarPerfiles(req, res) {
    try {
      const resultado = await perfilService.obtenerTodos();

      return res.status(resultado.statusCode).json(resultado);
    } catch (error) {
      console.error('Error en listarPerfiles:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Error al listar perfiles',
        errors: [error.message]
      });
    }
  }

  /**
   * PUT /perfiles/:empleadoId
   * Actualiza el perfil de un empleado
   */
  async actualizarPerfil(req, res) {
    try {
      const { empleadoId } = req.params;
      const datos = req.body;

      // Validar empleadoId
      const validacionId = PerfilValidator.validarEmpleadoId(empleadoId);
      if (!validacionId.valido) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'empleadoId inválido',
          errors: validacionId.errores
        });
      }

      // Validar datos de actualización
      const validacionDatos = PerfilValidator.validarActualizacion(datos);
      if (!validacionDatos.valido) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Datos inválidos',
          errors: validacionDatos.errores
        });
      }

      const resultado = await perfilService.actualizarPerfil(empleadoId, datos);

      return res.status(resultado.statusCode).json(resultado);
    } catch (error) {
      console.error('Error en actualizarPerfil:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Error al actualizar el perfil',
        errors: [error.message]
      });
    }
  }

  /**
   * POST /perfiles/evento/empleado-creado
   * Endpoint interno para recibir eventos de empleado.creado
   * En el futuro será reemplazado por RabbitMQ
   */
  async manejarEmpleadoCreado(req, res) {
    try {
      const { empleadoId, nombre, email } = req.body;

      // Validar datos del evento
      const validacion = PerfilValidator.validarCreacionDefault(empleadoId, nombre, email);
      if (!validacion.valido) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Datos del evento inválidos',
          errors: validacion.errores
        });
      }

      const resultado = await perfilService.crearPerfilDefault(empleadoId, nombre, email);

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
}

module.exports = new PerfilController();
