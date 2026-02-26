const empleadoRepository = require('../repositories/empleadoRepository');
const { validarEmpleado } = require('../validators/empleadoValidator');
const Empleado = require('../models/empleado');
const { httpGetWithCircuitBreaker } = require('../utils/circuitBreakerClient');
const { publicarEvento } = require('../config/rabbitmq');

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
        // Hacer petición con Circuit Breaker para resiliencia
        // Circuit Breaker maneja los fallos, no necesitamos reintentos en httpGet
        departamentoResponse = await httpGetWithCircuitBreaker(departamentoUrl, {
          timeout: 3000,
          retries: 0,  // Sin reintentos - el Circuit Breaker maneja la lógica de fallos
          retryDelay: 0
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

      // Si el Circuit Breaker está abierto, rechazar la operación
      if (departamentoResponse.circuitBreakerOpen) {
        return {
          success: false,
          statusCode: 503,
          message: 'Servicio de departamentos temporalmente no disponible (Circuit Breaker activado)',
          errors: ['El servicio está experimentando problemas. Intente nuevamente en unos momentos.']
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

      // Publicar evento empleado.creado en RabbitMQ
      await publicarEvento('empleado.creado', {
        empleadoId: empleadoCreado.id,
        nombre: empleadoCreado.nombre,
        email: empleadoCreado.email,
        departamentoId: empleadoCreado.departamentoId,
        fechaIngreso: empleadoCreado.fechaIngreso,
        timestamp: new Date().toISOString()
      });

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

  /**
   * Actualiza un empleado existente
   * @param {string} id - ID del empleado
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Resultado de la operación
   */
  async actualizarEmpleado(id, datos) {
    try {
      // Verificar que el empleado existe
      const empleadoExistente = await empleadoRepository.buscarPorId(id);
      if (!empleadoExistente) {
        return {
          success: false,
          statusCode: 404,
          message: `El empleado con id ${id} no existe`
        };
      }

      // Crear modelo con los nuevos datos
      const empleado = new Empleado({ ...datos, id });

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

      // Actualizar empleado
      const empleadoActualizado = await empleadoRepository.actualizar(id, empleado);

      if (!empleadoActualizado) {
        return {
          success: false,
          statusCode: 404,
          message: `El empleado con id ${id} no existe`
        };
      }

      return {
        success: true,
        statusCode: 200,
        data: empleadoActualizado.toJSON()
      };
    } catch (error) {
      console.error('Error al actualizar empleado:', error);
      return {
        success: false,
        statusCode: 500,
        message: 'Error interno al actualizar el empleado'
      };
    }
  }

  /**
   * Elimina un empleado (desvinculación)
   * @param {string} id - ID del empleado
   * @returns {Promise<Object>} Resultado de la operación
   */
  async eliminarEmpleado(id) {
    try {
      // Verificar que el empleado existe antes de eliminar
      const empleadoExistente = await empleadoRepository.buscarPorId(id);
      if (!empleadoExistente) {
        return {
          success: false,
          statusCode: 404,
          message: `El empleado con id ${id} no existe`
        };
      }

      // Eliminar empleado
      const eliminado = await empleadoRepository.eliminar(id);

      if (!eliminado) {
        return {
          success: false,
          statusCode: 404,
          message: `El empleado con id ${id} no existe`
        };
      }

      // Publicar evento empleado.eliminado en RabbitMQ
      await publicarEvento('empleado.eliminado', {
        empleadoId: empleadoExistente.id,
        nombre: empleadoExistente.nombre,
        email: empleadoExistente.email,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        statusCode: 200,
        message: `Empleado ${id} eliminado exitosamente`
      };
    } catch (error) {
      console.error('Error al eliminar empleado:', error);
      return {
        success: false,
        statusCode: 500,
        message: 'Error interno al eliminar el empleado'
      };
    }
  }
}

module.exports = new EmpleadoService();
