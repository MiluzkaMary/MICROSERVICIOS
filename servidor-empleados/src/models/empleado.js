/**
 * Model Empleado
 * Estado: ACTIVO , EN_VACACIONES , RETIRADO
 */
class Empleado {
  constructor(data = {}) {
    this.id = data.id !== undefined ? String(data.id).trim() : "";
    this.nombre = (data.nombre || "").trim();
    this.email = (data.email || "").trim().toLowerCase();
    this.departamentoId = data.departamentoId !== undefined ? String(data.departamentoId).trim() : "";
    this.fechaIngreso = data.fechaIngreso || null;
  }

  /**
   * Normalizacion de Empleado para respuestas JSON
   */
  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      email: this.email,
      departamentoId: this.departamentoId,
      fechaIngreso: this.fechaIngreso
    };
  }
}

module.exports = Empleado;
