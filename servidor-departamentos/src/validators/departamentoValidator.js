function isBlank(v) {
  return v === undefined || v === null || String(v).trim() === "";
}

/**
 * Valida los datos de un departamento
 * @param {Object} departamento - Objeto departamento a validar
 * @returns {Array} Array de errores (vacío si es válido)
 */
function validarDepartamento(departamento) {
  const errores = [];

  if (isBlank(departamento.nombre)) {
    errores.push("nombre es requerido");
  }

  // descripcion es opcional

  return errores;
}

module.exports = {
  validarDepartamento,
  isBlank
};
