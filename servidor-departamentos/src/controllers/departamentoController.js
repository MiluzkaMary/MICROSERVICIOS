const departamentoService = require('../services/departamentoService');

class DepartamentoController {
  /**
   * POST /departamentos 
   */
  async crear(req, res) {
    const resultado = await departamentoService.crearDepartamento(req.body || {});

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
   * GET /departamentos/:id 
   */
  async obtenerPorId(req, res) {
    const id = parseInt(req.params.id, 10);
    const resultado = await departamentoService.obtenerDepartamentoPorId(id);

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
   * GET /departamentos 
   * Soporta paginación y filtrado mediante query parameters
   */
  async obtenerTodos(req, res) {
    // Siempre usar paginación (por defecto page=1, limit=10)
    const resultado = await departamentoService.obtenerDepartamentosConPaginacion(req.query);

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

module.exports = new DepartamentoController();
