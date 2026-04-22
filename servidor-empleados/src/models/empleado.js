/**
 * Model Empleado
 * Estado: ACTIVO , EN_VACACIONES , RETIRADO
 */
class Empleado {
  constructor(data = {}) {
    if (data.id !== undefined && data.id !== null && String(data.id).trim() !== '') {
      const numericId = Number(data.id);
      this.id = Number.isFinite(numericId) ? numericId : String(data.id).trim();
    } else {
      this.id = undefined;
    }
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
