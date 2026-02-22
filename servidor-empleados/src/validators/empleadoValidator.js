
function isBlank(v) {
  return v === undefined || v === null || String(v).trim() === "";
}

function emailBasicoValido(email) {
  return typeof email === "string" && email.includes("@") && email.includes(".");
}

/**
 * Valida los datos de un empleado
 * @param {Object} empleado - Objeto empleado a validar
 * @returns {Array} Array de errores (vacío si es válido)
 */
function validarEmpleado(empleado) {
  const errores = [];

  if (isBlank(empleado.id)) {
    errores.push("id es requerido");
  }
  if (isBlank(empleado.nombre)) {
    errores.push("nombre es requerido");
  }
  if (isBlank(empleado.email)) {
    errores.push("email es requerido");
  } else if (!emailBasicoValido(empleado.email)) {
    errores.push("email inválido");
  }
  if (isBlank(empleado.departamentoId)) {
    errores.push("departamentoId es requerido");
  }
  if (!empleado.fechaIngreso) {
    errores.push("fechaIngreso es requerido");
  }

  return errores;
}

module.exports = {
  validarEmpleado,
  isBlank,
  emailBasicoValido
};
