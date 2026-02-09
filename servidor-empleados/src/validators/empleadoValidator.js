
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
  
  if (isBlank(empleado.apellido)) {
    errores.push("apellido es requerido");
  }
  
  if (isBlank(empleado.email)) {
    errores.push("email es requerido");
  } else if (!emailBasicoValido(empleado.email)) {
    errores.push("email inválido");
  }
  
  if (isBlank(empleado.numeroEmpleado)) {
    errores.push("numeroEmpleado es requerido");
  }
  
  if (isBlank(empleado.cargo)) {
    errores.push("cargo es requerido");
  }
  
  if (isBlank(empleado.area)) {
    errores.push("area es requerido");
  }

  return errores;
}

module.exports = {
  validarEmpleado,
  isBlank,
  emailBasicoValido
};
