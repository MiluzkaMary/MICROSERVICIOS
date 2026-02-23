const empleadoRepository = require('../repositories/empleadoRepository');
const { validarEmpleado } = require('../validators/empleadoValidator');
const Empleado = require('../models/empleado');
const { httpGet } = require('../utils/httpClient');

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

    // Validar que el departamento existe (comunicación entre servicios)
    try {
      // Obtener URL del servicio de departamentos desde variables de entorno
      const departamentosHost = process.env.DEPARTAMENTOS_SERVICE_HOST || 'departamentos-service';
      const departamentosPort = process.env.DEPARTAMENTOS_SERVICE_PORT || '8081';
      const departamentoUrl = `http://${departamentosHost}:${departamentosPort}/departamentos/${empleado.departamentoId}`;

      console.log(`Validando departamento ${empleado.departamentoId} en ${departamentoUrl}`);

      let departamentoResponse;
      try {
        // Hacer petición con timeout de 3s y 2 reintentos
        departamentoResponse = await httpGet(departamentoUrl, {
          timeout: 3000,
          retries: 2,
          retryDelay: 500
        });
      } catch (error) {
        // Error de red, timeout o servicio caído
        console.error('Error comunicándose con servicio de departamentos:', error.message);
        return {
          success: false,
          statusCode: 503,
          message: 'Servicio de departamentos no disponible. Intente nuevamente más tarde.',
          errors: ['El servicio de validación de departamentos no está respondiendo']
        };
      }

      // Validar respuesta del servicio de departamentos
      if (departamentoResponse.statusCode === 404) {
        return {
          success: false,
          statusCode: 400,
          message: `El departamento con id ${empleado.departamentoId} no existe`,
          errors: ['departamentoId inválido']
        };
      }

      if (departamentoResponse.statusCode === 201 || departamentoResponse.statusCode === 200) {
        console.log(`Departamento ${empleado.departamentoId} validado correctamente`);
      } else {
        // Cualquier otro código de error del servicio de departamentos
        return {
          success: false,
          statusCode: 502,
          message: 'Error validando departamento en el servicio externo',
          errors: ['No se pudo validar el departamento']
        };
      }

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
        statusCode: 201,
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
        statusCode: 201,
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
        statusCode: 201,
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

  /**
   * Obtiene empleados con paginación y filtrado
   * @param {Object} filtros - Filtros y opciones de paginación
   * @returns {Promise<Object>} Resultado de la operación
   */
  async obtenerEmpleadosConPaginacion(filtros) {
    try {
      // Validar y parsear parámetros con valores seguros
      const page = Math.max(parseInt(filtros.page || "1", 10), 1);
      const size = Math.min(Math.max(parseInt(filtros.size || "10", 10), 1), 100);

      // Preparar filtros sanitizados
      const q = (filtros.q || "").trim().toLowerCase();
      const estado = (filtros.estado || "").trim();
      const area = (filtros.area || "").trim().toLowerCase();
      const cargo = (filtros.cargo || "").trim().toLowerCase();
      const nombre = (filtros.nombre || "").trim().toLowerCase();
      const apellido = (filtros.apellido || "").trim().toLowerCase();

      // Preparar opciones
      const opciones = {
        page,
        size,
        sortBy: filtros.sortBy || 'id',
        order: filtros.order || 'ASC',
        q: q || undefined,
        nombre: nombre || undefined,
        apellido: apellido || undefined,
        cargo: cargo || undefined,
        area: area || undefined,
        estado: estado || undefined
      };

      const resultado = await empleadoRepository.obtenerConPaginacion(opciones);

      return {
        success: true,
        statusCode: 201,
        data: {
          page: resultado.page,
          size: resultado.size,
          totalRecords: resultado.totalRecords,
          totalPages: resultado.totalPages,
          items: resultado.items.map(emp => emp.toJSON())
        }
      };
    } catch (error) {
      console.error('Error al obtener empleados con paginación:', error);
      return {
        success: false,
        statusCode: 500,
        message: 'Error interno al obtener los empleados'
      };
    }
  }
}

module.exports = new EmpleadoService();
