/**
 * Lógica de negocio para Perfiles
 */
const perfilRepository = require('../repositories/perfilRepository');
const Perfil = require('../models/perfil');

class PerfilService {
  /**
   * Obtiene un perfil por empleadoId
   */
  async obtenerPerfilPorEmpleadoId(empleadoId) {
    const perfil = await perfilRepository.findByEmpleadoId(empleadoId);

    if (!perfil) {
      return {
        success: false,
        statusCode: 404,
        message: `Perfil no encontrado`,
        errors: [`No existe un perfil para el empleado con id ${empleadoId}`]
      };
    }

    return {
      success: true,
      statusCode: 200,
      data: perfil
    };
  }

  /**
   * Obtiene todos los perfiles
   */
  async obtenerTodos() {
    const perfiles = await perfilRepository.findAll();

    return {
      success: true,
      statusCode: 200,
      data: perfiles,
      total: perfiles.length
    };
  }

  /**
   * Obtiene perfiles con paginación y filtrado
   */
  async obtenerPerfilesConPaginacion(filtros) {
    try {
      // Validar y parsear parámetros con valores seguros
      const page = Math.max(parseInt(filtros.page || "1", 10), 1);
      const size = Math.min(Math.max(parseInt(filtros.size || "10", 10), 1), 100);

      // Preparar filtros sanitizados
      const q = (filtros.q || "").trim().toLowerCase();
      const nombre = (filtros.nombre || "").trim().toLowerCase();
      const email = (filtros.email || "").trim().toLowerCase();
      const ciudad = (filtros.ciudad || "").trim().toLowerCase();

      // Preparar opciones
      const opciones = {
        page,
        size,
        sortBy: filtros.sortBy || 'fecha_creacion',
        order: filtros.order || 'DESC',
        q: q || undefined,
        nombre: nombre || undefined,
        email: email || undefined,
        ciudad: ciudad || undefined
      };

      const resultado = await perfilRepository.obtenerConPaginacion(opciones);

      return {
        success: true,
        statusCode: 200,
        data: {
          page: resultado.page,
          size: resultado.size,
          totalRecords: resultado.totalRecords,
          totalPages: resultado.totalPages,
          items: resultado.items
        }
      };
    } catch (error) {
      console.error('Error al obtener perfiles con paginación:', error);
      return {
        success: false,
        statusCode: 500,
        message: 'Error interno al obtener los perfiles'
      };
    }
  }

  /**
   * Actualiza un perfil existente
   */
  async actualizarPerfil(empleadoId, datos) {
    // Verificar que el perfil existe
    const perfilExiste = await perfilRepository.existsByEmpleadoId(empleadoId);

    if (!perfilExiste) {
      return {
        success: false,
        statusCode: 404,
        message: `Perfil no encontrado`,
        errors: [`No existe un perfil para el empleado con id ${empleadoId}`]
      };
    }

    // Crear objeto Perfil con los datos a actualizar
    const perfilActualizado = new Perfil({
      telefono: datos.telefono || '',
      direccion: datos.direccion || '',
      ciudad: datos.ciudad || '',
      biografia: datos.biografia || ''
    });

    // Actualizar en la base de datos
    const perfilGuardado = await perfilRepository.updateByEmpleadoId(empleadoId, perfilActualizado);

    return {
      success: true,
      statusCode: 200,
      message: 'Perfil actualizado exitosamente',
      data: perfilGuardado
    };
  }

  /**
   * Crea un perfil por defecto (cuando se registra un nuevo empleado)
   * Este método será llamado cuando se reciba el evento empleado.creado
   */
  async crearPerfilDefault(empleadoId, nombre, email) {
    // Verificar que no exista ya un perfil para este empleado
    const perfilExiste = await perfilRepository.existsByEmpleadoId(empleadoId);

    if (perfilExiste) {
      console.warn(`Ya existe un perfil para el empleado ${empleadoId}`);
      return {
        success: false,
        statusCode: 409,
        message: `Ya existe un perfil para el empleado ${empleadoId}`,
        errors: ['Perfil duplicado']
      };
    }

    // Verificar que el email no esté en uso
    const emailEnUso = await perfilRepository.existsByEmail(email);

    if (emailEnUso) {
      console.warn(`El email ${email} ya está registrado en otro perfil`);
      return {
        success: false,
        statusCode: 409,
        message: `El email ${email} ya está registrado`,
        errors: ['Email duplicado']
      };
    }

    // Crear perfil por defecto
    const perfilDefault = Perfil.crearPerfilDefault(empleadoId, nombre, email);
    const perfilCreado = await perfilRepository.create(perfilDefault);

    console.log(`✅ Perfil creado automáticamente para empleado ${empleadoId}`);

    return {
      success: true,
      statusCode: 201,
      message: 'Perfil creado exitosamente',
      data: perfilCreado
    };
  }

  /**
    * Desactiva un perfil por empleadoId
   * Este método será llamado cuando se reciba el evento empleado.eliminado
   */
    async desactivarPerfilPorEmpleadoId(empleadoId) {
    try {
      // Verificar que el perfil existe
      const perfil = await perfilRepository.findByEmpleadoId(empleadoId);

      if (!perfil) {
        console.warn(`No existe un perfil para el empleado ${empleadoId}`);
        return {
          success: false,
          statusCode: 404,
          message: `No existe un perfil para el empleado ${empleadoId}`,
          errors: ['Perfil no encontrado']
        };
      }

      if (!perfil.activo) {
        return {
          success: true,
          statusCode: 200,
          message: `El perfil del empleado ${empleadoId} ya estaba desactivado`,
          data: perfil
        };
      }

      // Desactivar perfil
      const perfilDesactivado = await perfilRepository.desactivarByEmpleadoId(empleadoId);

      if (!perfilDesactivado) {
        return {
          success: false,
          statusCode: 404,
          message: `No se pudo desactivar el perfil del empleado ${empleadoId}`,
          errors: ['Error al desactivar perfil']
        };
      }

      console.log(`✅ Perfil desactivado automáticamente para empleado ${empleadoId}`);

      return {
        success: true,
        statusCode: 200,
        message: `Perfil del empleado ${empleadoId} desactivado exitosamente`,
        data: perfilDesactivado
      };
    } catch (error) {
      console.error('Error al desactivar perfil:', error);
      return {
        success: false,
        statusCode: 500,
        message: 'Error interno al desactivar el perfil'
      };
    }
  }

  /**
   * Reactiva un perfil por empleadoId
   */
  async reactivarPerfilPorEmpleadoId(empleadoId) {
    try {
      const perfil = await perfilRepository.findByEmpleadoId(empleadoId);

      if (!perfil) {
        console.warn(`No existe un perfil para reactivar del empleado ${empleadoId}`);
        return {
          success: false,
          statusCode: 404,
          message: `No existe un perfil para el empleado ${empleadoId}`,
          errors: ['Perfil no encontrado']
        };
      }

      if (perfil.activo) {
        return {
          success: true,
          statusCode: 200,
          message: `El perfil del empleado ${empleadoId} ya estaba activo`,
          data: perfil
        };
      }

      const perfilReactivado = await perfilRepository.reactivarByEmpleadoId(empleadoId);

      return {
        success: true,
        statusCode: 200,
        message: `Perfil del empleado ${empleadoId} reactivado exitosamente`,
        data: perfilReactivado
      };
    } catch (error) {
      console.error('Error al reactivar perfil:', error);
      return {
        success: false,
        statusCode: 500,
        message: 'Error interno al reactivar el perfil'
      };
    }
  }
}

module.exports = new PerfilService();
