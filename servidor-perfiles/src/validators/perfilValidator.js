/**
 * Validadores para Perfiles
 */
class PerfilValidator {
  /**
   * Valida los datos para actualizar un perfil
   */
  static validarActualizacion(datos) {
    const errores = [];

    // Telefono (opcional, pero si se envía debe ser válido)
    if (datos.telefono !== undefined && datos.telefono !== '') {
      if (typeof datos.telefono !== 'string') {
        errores.push('El teléfono debe ser una cadena de texto');
      } else if (datos.telefono.length > 20) {
        errores.push('El teléfono no puede tener más de 20 caracteres');
      }
    }

    // Direccion (opcional)
    if (datos.direccion !== undefined && datos.direccion !== '') {
      if (typeof datos.direccion !== 'string') {
        errores.push('La dirección debe ser una cadena de texto');
      } else if (datos.direccion.length > 255) {
        errores.push('La dirección no puede tener más de 255 caracteres');
      }
    }

    // Ciudad (opcional)
    if (datos.ciudad !== undefined && datos.ciudad !== '') {
      if (typeof datos.ciudad !== 'string') {
        errores.push('La ciudad debe ser una cadena de texto');
      } else if (datos.ciudad.length > 100) {
        errores.push('La ciudad no puede tener más de 100 caracteres');
      }
    }

    // Biografia (opcional)
    if (datos.biografia !== undefined && datos.biografia !== '') {
      if (typeof datos.biografia !== 'string') {
        errores.push('La biografía debe ser una cadena de texto');
      } else if (datos.biografia.length > 1000) {
        errores.push('La biografía no puede tener más de 1000 caracteres');
      }
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Valida empleadoId en la URL
   */
  static validarEmpleadoId(empleadoId) {
    const errores = [];

    if (!empleadoId || empleadoId.trim() === '') {
      errores.push('El empleadoId es requerido');
    } else if (empleadoId.length > 50) {
      errores.push('El empleadoId no puede tener más de 50 caracteres');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Valida datos para crear un perfil por defecto (desde evento)
   */
  static validarCreacionDefault(empleadoId, nombre, email) {
    const errores = [];

    if (!empleadoId || empleadoId.trim() === '') {
      errores.push('El empleadoId es requerido');
    }

    if (!nombre || nombre.trim() === '') {
      errores.push('El nombre es requerido');
    } else if (nombre.length > 100) {
      errores.push('El nombre no puede tener más de 100 caracteres');
    }

    if (!email || email.trim() === '') {
      errores.push('El email es requerido');
    } else if (!this.validarFormatoEmail(email)) {
      errores.push('El email no tiene un formato válido');
    } else if (email.length > 150) {
      errores.push('El email no puede tener más de 150 caracteres');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Valida el formato de un email
   */
  static validarFormatoEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
}

module.exports = PerfilValidator;
