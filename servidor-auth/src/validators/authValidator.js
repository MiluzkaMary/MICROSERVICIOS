/**
 * Validadores para el servicio de autenticación
 * Usa validación simple sin librerías externas para mantener dependencias mínimas
 */

/**
 * Validar email
 */
function esEmailValido(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validar contraseña (mínimo 6 caracteres)
 * DECISIÓN MÍNIMA PROPUESTA: Validación básica, puede extenderse con regex complejo
 */
function esPasswordValida(password) {
  return password && password.length >= 6;
}

/**
 * Validar token (formato UUID)
 */
function esTokenValido(token) {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(token);
}

/**
 * Validar datos de login
 */
function validarLogin(data) {
  const errores = [];

  if (!data.email) {
    errores.push('Email es requerido');
  } else if (!esEmailValido(data.email)) {
    errores.push('Email inválido');
  }

  if (!data.password) {
    errores.push('Password es requerido');
  } else if (!esPasswordValida(data.password)) {
    errores.push('Password debe tener al menos 6 caracteres');
  }

  if (errores.length > 0) {
    return {
      error: { details: [{ message: errores.join(', ') }] }
    };
  }

  return {
    value: {
      email: data.email.toLowerCase().trim(),
      password: data.password
    }
  };
}

/**
 * Validar solicitud de recuperación
 */
function validarRecuperacion(data) {
  const errores = [];

  if (!data.email) {
    errores.push('Email es requerido');
  } else if (!esEmailValido(data.email)) {
    errores.push('Email inválido');
  }

  if (errores.length > 0) {
    return {
      error: { details: [{ message: errores.join(', ') }] }
    };
  }

  return {
    value: {
      email: data.email.toLowerCase().trim()
    }
  };
}

/**
 * Validar reset de contraseña
 */
function validarReset(data) {
  const errores = [];

  if (!data.token) {
    errores.push('Token es requerido');
  } else if (!esTokenValido(data.token)) {
    errores.push('Token inválido');
  }

  if (!data.nuevaPassword) {
    errores.push('Nueva contraseña es requerida');
  } else if (!esPasswordValida(data.nuevaPassword)) {
    errores.push('Nueva contraseña debe tener al menos 6 caracteres');
  }

  if (errores.length > 0) {
    return {
      error: { details: [{ message: errores.join(', ') }] }
    };
  }

  return {
    value: {
      token: data.token,
      nuevaPassword: data.nuevaPassword
    }
  };
}

module.exports = {
  validarLogin,
  validarRecuperacion,
  validarReset
};
