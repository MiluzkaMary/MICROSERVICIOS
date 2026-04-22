
function isBlank(v) {
  return v === undefined || v === null || String(v).trim() === "";
}

function emailBasicoValido(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function fechaIngresoValida(fechaIngreso) {
  if (typeof fechaIngreso !== "string") {
    return false;
  }

  const coincidencia = fechaIngreso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!coincidencia) {
    return false;
  }

  const anio = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const dia = Number(coincidencia[3]);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));

  return (
    fecha.getUTCFullYear() === anio &&
    fecha.getUTCMonth() === mes - 1 &&
    fecha.getUTCDate() === dia
  );
}

/**
 * Valida los datos de un empleado
 * @param {Object} empleado - Objeto empleado a validar
 * @returns {Array} Array de errores (vacío si es válido)
 */
function validarEmpleado(empleado) {
  const errores = [];

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
  } else if (!fechaIngresoValida(empleado.fechaIngreso)) {
    errores.push("fechaIngreso inválido");
  }

  return errores;
}

module.exports = {
  validarEmpleado,
  isBlank,
  emailBasicoValido
};
