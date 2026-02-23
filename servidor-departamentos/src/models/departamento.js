/**
 * Model Departamento
 */
class Departamento {
  constructor(data = {}) {
    this.id = data.id !== undefined ? parseInt(data.id, 10) : undefined;
    this.nombre = (data.nombre || "").trim();
    this.descripcion = (data.descripcion || "").trim();
  }

  /**
   * Normalizacion de Departamento para respuestas JSON
   */
  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion
    };
  }
}

module.exports = Departamento;
