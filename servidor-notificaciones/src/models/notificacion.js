/**
 * Modelo Notificacion
 * Representa una notificación enviada a un empleado
 */
class Notificacion {
  constructor(data = {}) {
    this.id = data.id !== undefined ? parseInt(data.id, 10) : undefined;
    this.tipo = (data.tipo || "").trim().toUpperCase();
    this.destinatario = (data.destinatario || "").trim();
    this.mensaje = (data.mensaje || "").trim();
    this.fechaEnvio = data.fecha_envio || data.fechaEnvio;
    this.empleadoId = (data.empleado_id || data.empleadoId || "").trim();
    this.estado = (data.estado || "ENVIADA").trim().toUpperCase();
  }

  /**
   * Normalización de Notificacion para respuestas JSON
   */
  toJSON() {
    return {
      id: this.id,
      tipo: this.tipo,
      destinatario: this.destinatario,
      mensaje: this.mensaje,
      fechaEnvio: this.fechaEnvio,
      empleadoId: this.empleadoId,
      estado: this.estado
    };
  }

  /**
   * Crea una notificación de bienvenida
   */
  static crearBienvenida(empleadoId, nombre, email) {
    return new Notificacion({
      tipo: 'BIENVENIDA',
      destinatario: email,
      mensaje: `¡Bienvenido a la empresa ${nombre}! Estamos emocionados de tenerte en el equipo. Tu ID de empleado es ${empleadoId}.`,
      empleadoId: empleadoId,
      estado: 'PENDIENTE'
    });
  }

  /**
   * Crea una notificación de desvinculación
   */
  static crearDesvinculacion(empleadoId, nombre, email, motivo = '') {
    const mensajeMotivo = motivo ? ` Motivo: ${motivo}` : '';
    return new Notificacion({
      tipo: 'DESVINCULACION',
      destinatario: email,
      mensaje: `Estimado/a ${nombre}, lamentamos informarte que tu relación laboral con la empresa ha finalizado.${mensajeMotivo} Te deseamos lo mejor en tus futuros proyectos.`,
      empleadoId: empleadoId,
      estado: 'PENDIENTE'
    });
  }
}

module.exports = Notificacion;
