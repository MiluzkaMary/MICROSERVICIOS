/**
 * Lógica de negocio para Notificaciones
 */
const notificacionRepository = require('../repositories/notificacionRepository');
const emailService = require('./emailService');
const Notificacion = require('../models/notificacion');

class NotificacionService {
  /**
   * Obtiene todas las notificaciones
   */
  async obtenerTodas() {
    const notificaciones = await notificacionRepository.findAll();

    return {
      success: true,
      statusCode: 200,
      data: notificaciones,
      total: notificaciones.length
    };
  }

  /**
   * Obtiene notificaciones con paginación y filtrado
   */
  async obtenerNotificacionesConPaginacion(filtros) {
    try {
      // Validar y parsear parámetros con valores seguros
      const page = Math.max(parseInt(filtros.page || "1", 10), 1);
      const size = Math.min(Math.max(parseInt(filtros.size || "10", 10), 1), 100);

      // Preparar filtros sanitizados
      const q = (filtros.q || "").trim().toLowerCase();
      const tipo = (filtros.tipo || "").trim();
      const estado = (filtros.estado || "").trim();
      const empleadoId = (filtros.empleadoId || "").trim();
      const destinatario = (filtros.destinatario || "").trim().toLowerCase();

      // Preparar opciones
      const opciones = {
        page,
        size,
        sortBy: filtros.sortBy || 'fecha_envio',
        order: filtros.order || 'DESC',
        q: q || undefined,
        tipo: tipo || undefined,
        estado: estado || undefined,
        empleadoId: empleadoId || undefined,
        destinatario: destinatario || undefined
      };

      const resultado = await notificacionRepository.obtenerConPaginacion(opciones);

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
      console.error('Error al obtener notificaciones con paginación:', error);
      return {
        success: false,
        statusCode: 500,
        message: 'Error interno al obtener las notificaciones'
      };
    }
  }

  /**
   * Obtiene notificaciones de un empleado específico
   */
  async obtenerPorEmpleado(empleadoId) {
    const notificaciones = await notificacionRepository.findByEmpleadoId(empleadoId);

    return {
      success: true,
      statusCode: 200,
      data: notificaciones,
      total: notificaciones.length
    };
  }

  /**
   * Obtiene estadísticas de notificaciones
   */
  async obtenerEstadisticas() {
    const estadisticas = await notificacionRepository.getEstadisticas();

    return {
      success: true,
      statusCode: 200,
      data: estadisticas
    };
  }

  /**
   * Procesa evento de empleado creado y envía notificación de bienvenida
   */
  async procesarEmpleadoCreado(empleadoId, nombre, email) {
    console.log(`📬 Procesando notificación de bienvenida para ${nombre} (${empleadoId})`);

    // Crear notificación en DB
    const notificacion = Notificacion.crearBienvenida(empleadoId, nombre, email);
    let notificacionGuardada;

    try {
      // Guardar en DB con estado PENDIENTE
      notificacionGuardada = await notificacionRepository.create(notificacion);

      // Intentar enviar email
      const resultadoEmail = await emailService.enviarBienvenida(nombre, email, empleadoId);

      // Actualizar estado según resultado
      if (resultadoEmail.success) {
        await notificacionRepository.updateEstado(notificacionGuardada.id, 'ENVIADA');
        notificacionGuardada.estado = 'ENVIADA';
        console.log(`✅ Notificación de bienvenida enviada a ${email}`);
      } else {
        await notificacionRepository.updateEstado(notificacionGuardada.id, 'FALLIDA');
        notificacionGuardada.estado = 'FALLIDA';
        console.warn(`⚠️ Notificación registrada pero email falló: ${resultadoEmail.error}`);
      }

      return {
        success: true,
        statusCode: 201,
        message: 'Notificación de bienvenida procesada',
        data: notificacionGuardada
      };

    } catch (error) {
      console.error('❌ Error al procesar notificación de bienvenida:', error);
      
      // Si se guardó pero falló el email, actualizar estado
      if (notificacionGuardada) {
        await notificacionRepository.updateEstado(notificacionGuardada.id, 'FALLIDA');
      }

      return {
        success: false,
        statusCode: 500,
        message: 'Error al procesar notificación',
        errors: [error.message]
      };
    }
  }

  /**
   * Procesa evento de empleado desvinculado y envía notificación
   */
  async procesarEmpleadoDesvinculado(empleadoId, nombre, email, motivo = '') {
    console.log(`📬 Procesando notificación de desvinculación para ${nombre} (${empleadoId})`);

    // Crear notificación en DB
    const notificacion = Notificacion.crearDesvinculacion(empleadoId, nombre, email, motivo);
    let notificacionGuardada;

    try {
      // Guardar en DB con estado PENDIENTE
      notificacionGuardada = await notificacionRepository.create(notificacion);

      // Intentar enviar email
      const resultadoEmail = await emailService.enviarDesvinculacion(nombre, email, empleadoId, motivo);

      // Actualizar estado según resultado
      if (resultadoEmail.success) {
        await notificacionRepository.updateEstado(notificacionGuardada.id, 'ENVIADA');
        notificacionGuardada.estado = 'ENVIADA';
        console.log(`✅ Notificación de desvinculación enviada a ${email}`);
      } else {
        await notificacionRepository.updateEstado(notificacionGuardada.id, 'FALLIDA');
        notificacionGuardada.estado = 'FALLIDA';
        console.warn(`⚠️ Notificación registrada pero email falló: ${resultadoEmail.error}`);
      }

      return {
        success: true,
        statusCode: 201,
        message: 'Notificación de desvinculación procesada',
        data: notificacionGuardada
      };

    } catch (error) {
      console.error('❌ Error al procesar notificación de desvinculación:', error);
      
      // Si se guardó pero falló el email, actualizar estado
      if (notificacionGuardada) {
        await notificacionRepository.updateEstado(notificacionGuardada.id, 'FALLIDA');
      }

      return {
        success: false,
        statusCode: 500,
        message: 'Error al procesar notificación',
        errors: [error.message]
      };
    }
  }

  /**
   * Procesa evento de usuario creado y envía email de activación
   */
  async procesarUsuarioCreado(empleadoId, email, token, nombre = null) {
    console.log(`📬 Procesando email de activación para ${empleadoId}`);

    // Crear notificación en DB
    const notificacion = new Notificacion({
      empleadoId: empleadoId,
      tipo: 'ACTIVACION',
      destinatario: email,
      asunto: '🔐 Activa tu cuenta - Sistema de Empleados',
      mensaje: `Token de activación generado para ${empleadoId}`,
      estado: 'PENDIENTE',
      fechaEnvio: new Date()
    });

    let notificacionGuardada;

    try {
      // Guardar en DB con estado PENDIENTE
      notificacionGuardada = await notificacionRepository.create(notificacion);

      // Intentar enviar email
      const resultadoEmail = await emailService.enviarEmailActivacion(
        nombre,
        email,
        empleadoId,
        token
      );

      // Actualizar estado según resultado
      if (resultadoEmail.success) {
        await notificacionRepository.updateEstado(notificacionGuardada.id, 'ENVIADA');
        notificacionGuardada.estado = 'ENVIADA';
        console.log(`✅ Email de activación enviado a ${email}`);
      } else {
        await notificacionRepository.updateEstado(notificacionGuardada.id, 'FALLIDA');
        notificacionGuardada.estado = 'FALLIDA';
        console.warn(`⚠️ Notificación registrada pero email falló: ${resultadoEmail.error}`);
      }

      return {
        success: true,
        statusCode: 201,
        message: 'Email de activación procesado',
        data: notificacionGuardada
      };

    } catch (error) {
      console.error('❌ Error al procesar email de activación:', error);
      
      // Si se guardó pero falló el email, actualizar estado
      if (notificacionGuardada) {
        await notificacionRepository.updateEstado(notificacionGuardada.id, 'FALLIDA');
      }

      return {
        success: false,
        statusCode: 500,
        message: 'Error al procesar email de activación',
        errors: [error.message]
      };
    }
  }

  /**
   * Procesa evento de recuperación de contraseña y envía email con token
   */
  async procesarUsuarioRecuperacion(empleadoId, email, token) {
    console.log(`📬 Procesando email de recuperación de contraseña para ${empleadoId}`);

    // Crear notificación en DB
    const notificacion = new Notificacion({
      empleadoId: empleadoId,
      tipo: 'RECUPERACION',
      destinatario: email,
      asunto: '🔑 Recuperación de Contraseña - Sistema de Empleados',
      mensaje: `Token de recuperación generado para ${empleadoId}`,
      estado: 'PENDIENTE',
      fechaEnvio: new Date()
    });

    let notificacionGuardada;

    try {
      // Guardar en DB con estado PENDIENTE
      notificacionGuardada = await notificacionRepository.create(notificacion);

      // Intentar enviar email
      const resultadoEmail = await emailService.enviarEmailRecuperacion(
        email,
        empleadoId,
        token
      );

      // Actualizar estado según resultado
      if (resultadoEmail.success) {
        await notificacionRepository.updateEstado(notificacionGuardada.id, 'ENVIADA');
        notificacionGuardada.estado = 'ENVIADA';
        console.log(`✅ Email de recuperación enviado a ${email}`);
      } else {
        await notificacionRepository.updateEstado(notificacionGuardada.id, 'FALLIDA');
        notificacionGuardada.estado = 'FALLIDA';
        console.warn(`⚠️ Notificación registrada pero email falló: ${resultadoEmail.error}`);
      }

      return {
        success: true,
        statusCode: 201,
        message: 'Email de recuperación procesado',
        data: notificacionGuardada
      };

    } catch (error) {
      console.error('❌ Error al procesar email de recuperación:', error);
      
      // Si se guardó pero falló el email, actualizar estado
      if (notificacionGuardada) {
        await notificacionRepository.updateEstado(notificacionGuardada.id, 'FALLIDA');
      }

      return {
        success: false,
        statusCode: 500,
        message: 'Error al procesar email de recuperación',
        errors: [error.message]
      };
    }
  }
}

module.exports = new NotificacionService();
