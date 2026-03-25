/**
 * Modelo de Usuario
 * Representa un usuario del sistema con sus credenciales y permisos
 */
class Usuario {
  constructor(data) {
    this.id = data.id;
    this.empleadoId = data.empleado_id;
    this.email = data.email;
    this.passwordHash = data.password_hash;
    this.role = data.role; // ADMIN o USER
    this.activo = data.activo;
    this.tokenRecuperacion = data.token_recuperacion;
    this.tokenExpiracion = data.token_expiracion;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Verifica si el usuario tiene una contraseña establecida
   */
  tienePassword() {
    return this.passwordHash !== null && this.passwordHash !== '';
  }

  /**
   * Verifica si el usuario puede iniciar sesión
   */
  puedeIniciarSesion() {
    return this.activo && this.tienePassword();
  }

  /**
   * Verifica si el token de recuperación es válido
   */
  tokenRecuperacionValido() {
    if (!this.tokenRecuperacion || !this.tokenExpiracion) {
      return false;
    }
    return new Date() < new Date(this.tokenExpiracion);
  }

  /**
   * Convierte el usuario a objeto JSON (sin datos sensibles)
   */
  toJSON() {
    return {
      empleadoId: this.empleadoId,
      email: this.email,
      role: this.role,
      activo: this.activo
    };
  }
}

module.exports = Usuario;
