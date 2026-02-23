const departamentoRepository = require('../repositories/departamentoRepository');
const { validarDepartamento } = require('../validators/departamentoValidator');
const Departamento = require('../models/departamento');

class DepartamentoService {
  /**
   * Crea un nuevo departamento
   * @param {Object} datos 
   * @returns {Promise<Object>} 
   */
  async crearDepartamento(datos) {
    // Crear instancia del modelo
    const departamento = new Departamento(datos);

    // Validar datos
    const errores = validarDepartamento(departamento);
    if (errores.length > 0) {
      return {
        success: false,
        statusCode: 400,
        message: "Datos inválidos",
        errors: errores
      };
    }

    try {
      // Verificar duplicados por nombre
      const departamentoExistente = await departamentoRepository.buscarPorNombre(departamento.nombre);
      if (departamentoExistente) {
        return {
          success: false,
          statusCode: 409,
          message: `Ya existe un departamento con el nombre ${departamento.nombre}`
        };
      }

      // Crear departamento
      const departamentoCreado = await departamentoRepository.crear(departamento);

      return {
        success: true,
        statusCode: 201,
        data: departamentoCreado.toJSON()
      };
    } catch (error) {
      console.error('Error al crear departamento:', error);
      return {
        success: false,
        statusCode: 500,
        message: 'Error interno al crear el departamento'
      };
    }
  }

  /**
   * Obtiene un departamento por ID
   * @param {number} id - ID del departamento
   * @returns {Promise<Object>} 
   */
  async obtenerDepartamentoPorId(id) {
    try {
      const departamento = await departamentoRepository.buscarPorId(id);

      if (!departamento) {
        return {
          success: false,
          statusCode: 404,
          message: `El departamento con id ${id} no existe`
        };
      }

      return {
        success: true,
        statusCode: 201,
        data: departamento.toJSON()
      };
    } catch (error) {
      console.error('Error al obtener departamento:', error);
      return {
        success: false,
        statusCode: 500,
        message: 'Error interno al obtener el departamento'
      };
    }
  }

  /**
   * Obtiene todos los departamentos
   * @returns {Promise<Object>} Resultado de la operación
   */
  async obtenerTodosDepartamentos() {
    try {
      const departamentos = await departamentoRepository.obtenerTodos();

      return {
        success: true,
        statusCode: 201,
        data: departamentos.map(dep => dep.toJSON())
      };
    } catch (error) {
      console.error('Error al obtener departamentos:', error);
      return {
        success: false,
        statusCode: 500,
        message: 'Error interno al obtener los departamentos'
      };
    }
  }

  /**
   * Obtiene departamentos con paginación y filtrado
   * @param {Object} filtros - Filtros y opciones de paginación
   * @returns {Promise<Object>} Resultado de la operación
   */
  async obtenerDepartamentosConPaginacion(filtros) {
    try {
      // Validar y parsear parámetros con valores seguros
      const page = Math.max(parseInt(filtros.page || "1", 10), 1);
      const size = Math.min(Math.max(parseInt(filtros.size || "10", 10), 1), 100);

      // Preparar filtros sanitizados
      const q = (filtros.q || "").trim().toLowerCase();
      const nombre = (filtros.nombre || "").trim().toLowerCase();

      // Preparar opciones
      const opciones = {
        page,
        size,
        sortBy: filtros.sortBy || 'id',
        order: filtros.order || 'ASC',
        q: q || undefined,
        nombre: nombre || undefined
      };

      const resultado = await departamentoRepository.obtenerConPaginacion(opciones);

      return {
        success: true,
        statusCode: 201,
        data: {
          page: resultado.page,
          size: resultado.size,
          totalRecords: resultado.totalRecords,
          totalPages: resultado.totalPages,
          items: resultado.items.map(dep => dep.toJSON())
        }
      };
    } catch (error) {
      console.error('Error al obtener departamentos con paginación:', error);
      return {
        success: false,
        statusCode: 500,
        message: 'Error interno al obtener los departamentos'
      };
    }
  }
}

module.exports = new DepartamentoService();
