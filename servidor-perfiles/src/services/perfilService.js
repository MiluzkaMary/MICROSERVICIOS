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
}

module.exports = new PerfilService();
