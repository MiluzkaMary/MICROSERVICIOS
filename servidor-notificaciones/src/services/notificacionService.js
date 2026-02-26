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
}

module.exports = new NotificacionService();
