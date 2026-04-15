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
    this.activo = data.activo !== undefined ? Boolean(data.activo) : true;
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
      fechaIngreso: this.fechaIngreso,
      activo: this.activo
    };
  }
}

module.exports = Empleado;
