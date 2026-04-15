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
