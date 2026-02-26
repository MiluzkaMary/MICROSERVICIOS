/**
 * Validadores para Notificaciones
 */
class NotificacionValidator {
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
   * Valida datos del evento empleado.creado
   */
  static validarEventoEmpleadoCreado(datos) {
    const errores = [];

    if (!datos.empleadoId || datos.empleadoId.trim() === '') {
      errores.push('El empleadoId es requerido');
    }

    if (!datos.nombre || datos.nombre.trim() === '') {
      errores.push('El nombre es requerido');
    }

    if (!datos.email || datos.email.trim() === '') {
      errores.push('El email es requerido');
    } else if (!this.validarFormatoEmail(datos.email)) {
      errores.push('El email no tiene un formato válido');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Valida datos del evento empleado.desvinculado
   */
  static validarEventoEmpleadoDesvinculado(datos) {
    const errores = [];

    if (!datos.empleadoId || datos.empleadoId.trim() === '') {
      errores.push('El empleadoId es requerido');
    }

    if (!datos.nombre || datos.nombre.trim() === '') {
      errores.push('El nombre es requerido');
    }

    if (!datos.email || datos.email.trim() === '') {
      errores.push('El email es requerido');
    } else if (!this.validarFormatoEmail(datos.email)) {
      errores.push('El email no tiene un formato válido');
    }

    // motivo es opcional

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

module.exports = NotificacionValidator;
