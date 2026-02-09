/**
 * Model Empleado
 * Estado: ACTIVO , EN_VACACIONES , RETIRADO
 */
class Empleado {
  constructor(data = {}) {
    this.id = data.id !== undefined ? String(data.id).trim() : "";
    this.nombre = (data.nombre || "").trim();
    this.apellido = (data.apellido || "").trim();
    this.email = (data.email || "").trim().toLowerCase();
    this.numeroEmpleado = data.numeroEmpleado !== undefined ? String(data.numeroEmpleado).trim() : "";
    this.cargo = (data.cargo || "").trim();
    this.area = (data.area || "").trim();
    this.estado = (data.estado || "ACTIVO").trim();
  }

  /**
   * Normalizacion de Empleado para respuestas JSON
   */
  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      apellido: this.apellido,
      email: this.email,
      numeroEmpleado: this.numeroEmpleado,
      cargo: this.cargo,
      area: this.area,
      estado: this.estado
    };
  }
}

module.exports = Empleado;
