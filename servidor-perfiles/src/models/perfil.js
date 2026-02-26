/**
 * Modelo Perfil
 * Representa el perfil de un empleado con información personal
 */
class Perfil {
  constructor(data = {}) {
    this.id = data.id !== undefined ? parseInt(data.id, 10) : undefined;
    this.empleadoId = (data.empleado_id || data.empleadoId || "").trim();
    this.nombre = (data.nombre || "").trim();
    this.email = (data.email || "").trim();
    this.telefono = (data.telefono || "").trim();
    this.direccion = (data.direccion || "").trim();
    this.ciudad = (data.ciudad || "").trim();
    this.biografia = (data.biografia || "").trim();
    this.fechaCreacion = data.fecha_creacion || data.fechaCreacion;
    this.fechaActualizacion = data.fecha_actualizacion || data.fechaActualizacion;
  }

  /**
   * Normalización de Perfil para respuestas JSON
   */
  toJSON() {
    return {
      id: this.id,
      empleadoId: this.empleadoId,
      nombre: this.nombre,
      email: this.email,
      telefono: this.telefono,
      direccion: this.direccion,
      ciudad: this.ciudad,
      biografia: this.biografia,
      fechaCreacion: this.fechaCreacion,
      fechaActualizacion: this.fechaActualizacion
    };
  }

  /**
   * Crea un perfil por defecto a partir de datos de empleado
   */
  static crearPerfilDefault(empleadoId, nombre, email) {
    return new Perfil({
      empleadoId,
      nombre,
      email,
      telefono: '',
      direccion: '',
      ciudad: '',
      biografia: ''
    });
  }
}

module.exports = Perfil;
