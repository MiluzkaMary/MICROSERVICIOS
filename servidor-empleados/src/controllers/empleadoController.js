
const empleadoService = require('../services/empleadoService');

class EmpleadoController {
  /**
   * POST /empleados 
   */
  async crear(req, res) {
    const resultado = await empleadoService.crearEmpleado(req.body || {});

    if (!resultado.success) {
      return res.status(resultado.statusCode).json({
        error: this._getErrorName(resultado.statusCode),
        message: resultado.message,
        status: resultado.statusCode,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
        errors: resultado.errors
      });
    }

    return res.status(resultado.statusCode).json(resultado.data);
  }

  /**
   * GET /empleados/:id 
   */
  async obtenerPorId(req, res) {
    const id = String(req.params.id);
    const resultado = await empleadoService.obtenerEmpleadoPorId(id);

    if (!resultado.success) {
      return res.status(resultado.statusCode).json({
        error: this._getErrorName(resultado.statusCode),
        message: resultado.message,
        status: resultado.statusCode,
        path: req.originalUrl,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(resultado.statusCode).json(resultado.data);
  }

  /**
   * GET /empleados 
   * Soporta paginación y filtrado mediante query parameters
   */
  async obtenerTodos(req, res) {
    // Siempre usar paginación (por defecto page=1, limit=10)
    const resultado = await empleadoService.obtenerEmpleadosConPaginacion(req.query);

    if (!resultado.success) {
      return res.status(resultado.statusCode).json({
        error: this._getErrorName(resultado.statusCode),
        message: resultado.message,
        status: resultado.statusCode,
        path: req.originalUrl,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(resultado.statusCode).json(resultado.data);
  }

  /**
   * Helper para obtener nombre de error según código HTTP
   * @private
   */
  _getErrorName(statusCode) {
    const errorNames = {
      400: 'Bad Request',
      404: 'Not Found',
      409: 'Conflict',
      500: 'Internal Server Error'
    };
    return errorNames[statusCode] || 'Error';
  }
}

module.exports = new EmpleadoController();
