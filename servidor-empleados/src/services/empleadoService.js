const empleadoRepository = require('../repositories/empleadoRepository');
const { validarEmpleado } = require('../validators/empleadoValidator');
const Empleado = require('../models/empleado');

class EmpleadoService {
  /**
   * Crea un nuevo empleado
   * @param {Object} datos 
   * @returns {Promise<Object>} 
   */
  async crearEmpleado(datos) {
    // Crear instancia del modelo
    const empleado = new Empleado(datos);

    // Validar datos
    const errores = validarEmpleado(empleado);
    if (errores.length > 0) {
      return {
        success: false,
        statusCode: 400,
        message: "Datos inválidos",
        errors: errores
      };
    }

    try {
      // Verificar duplicados por ID
      const empleadoExistentePorId = await empleadoRepository.buscarPorId(empleado.id);
      if (empleadoExistentePorId) {
        return {
          success: false,
          statusCode: 409,
          message: `Ya existe un empleado con id ${empleado.id}`
        };
      }

      // Verificar duplicados por email
      const empleadoExistentePorEmail = await empleadoRepository.buscarPorEmail(empleado.email);
      if (empleadoExistentePorEmail) {
        return {
          success: false,
          statusCode: 409,
          message: `Ya existe un empleado con email ${empleado.email}`
        };
      }

      // Crear empleado
      const empleadoCreado = await empleadoRepository.crear(empleado);

      return {
        success: true,
        statusCode: 200,
        data: empleadoCreado.toJSON()
      };
    } catch (error) {
      console.error('Error al crear empleado:', error);
      return {
        success: false,
        statusCode: 500,
        message: 'Error interno al crear el empleado'
      };
    }
  }

  /**
   * Obtiene un empleado por ID
   * @param {string} id - ID del empleado
   * @returns {Promise<Object>} 
   */
  async obtenerEmpleadoPorId(id) {
    try {
      const empleado = await empleadoRepository.buscarPorId(id);

      if (!empleado) {
        return {
          success: false,
          statusCode: 404,
          message: `El empleado con id ${id} no existe`
        };
      }

      return {
        success: true,
        statusCode: 200,
        data: empleado.toJSON()
      };
    } catch (error) {
      console.error('Error al obtener empleado:', error);
      return {
        success: false,
        statusCode: 500,
        message: 'Error interno al obtener el empleado'
      };
    }
  }

  /**
   * Obtiene todos los empleados
   * @returns {Promise<Object>} Resultado de la operación
   */
  async obtenerTodosEmpleados() {
    try {
      const empleados = await empleadoRepository.obtenerTodos();

      return {
        success: true,
        statusCode: 200,
        data: empleados.map(emp => emp.toJSON())
      };
    } catch (error) {
      console.error('Error al obtener empleados:', error);
      return {
        success: false,
        statusCode: 500,
        message: 'Error interno al obtener los empleados'
      };
    }
  }
}

module.exports = new EmpleadoService();
