
const empleadoService = require('../services/empleadoService');

class EmpleadoController {
  /**
   * POST /empleados 
   */
  async crear(req, res) {
    const resultado = await empleadoService.crearEmpleado(req.body || {});

    if (!resultado.success) {
      return res.status(resultado.statusCode).json({
        message: resultado.message,
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
      return res.status(resultado.statusCode).send(resultado.message);
    }

    return res.status(resultado.statusCode).json(resultado.data);
  }

  /**
   * GET /empleados 
   */
  async obtenerTodos(req, res) {
    const resultado = await empleadoService.obtenerTodosEmpleados();

    if (!resultado.success) {
      return res.status(resultado.statusCode).send(resultado.message);
    }

    return res.status(resultado.statusCode).json(resultado.data);
  }
}

module.exports = new EmpleadoController();
