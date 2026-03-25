/**
 * Repositorio de Usuarios
 * Maneja las operaciones de base de datos para usuarios
 */
const pool = require('../config/database');
const Usuario = require('../models/usuario');

class UsuarioRepository {
  /**
   * Buscar usuario por email
   */
  async buscarPorEmail(email) {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );
    return result.rows.length > 0 ? new Usuario(result.rows[0]) : null;
  }

  /**
   * Buscar usuario por empleadoId
   */
  async buscarPorEmpleadoId(empleadoId) {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE empleado_id = $1',
      [empleadoId]
    );
    return result.rows.length > 0 ? new Usuario(result.rows[0]) : null;
  }

  /**
   * Buscar usuario por token de recuperación
   */
  async buscarPorToken(token) {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE token_recuperacion = $1',
      [token]
    );
    return result.rows.length > 0 ? new Usuario(result.rows[0]) : null;
  }

  /**
   * Crear nuevo usuario (sin contraseña)
   */
  async crear(empleadoId, email, role = 'USER') {
    const result = await pool.query(
      `INSERT INTO usuarios (empleado_id, email, role, activo, password_hash) 
       VALUES ($1, $2, $3, true, NULL) 
       RETURNING *`,
      [empleadoId, email, role]
    );
    return new Usuario(result.rows[0]);
  }

  /**
   * Establecer token de recuperación/activación
   */
  async establecerTokenRecuperacion(empleadoId, token, expiracion) {
    const result = await pool.query(
      `UPDATE usuarios 
       SET token_recuperacion = $1, token_expiracion = $2, updated_at = CURRENT_TIMESTAMP
       WHERE empleado_id = $3
       RETURNING *`,
      [token, expiracion, empleadoId]
    );
    return result.rows.length > 0 ? new Usuario(result.rows[0]) : null;
  }

  /**
   * Establecer contraseña (hash)
   */
  async establecerPassword(empleadoId, passwordHash) {
    const result = await pool.query(
      `UPDATE usuarios 
       SET password_hash = $1, 
           token_recuperacion = NULL, 
           token_expiracion = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE empleado_id = $2
       RETURNING *`,
      [passwordHash, empleadoId]
    );
    return result.rows.length > 0 ? new Usuario(result.rows[0]) : null;
  }

  /**
   * Inhabilitar usuario (eliminación lógica)
   */
  async inhabilitar(empleadoId) {
    const result = await pool.query(
      `UPDATE usuarios 
       SET activo = false, 
           token_recuperacion = NULL, 
           token_expiracion = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE empleado_id = $1
       RETURNING *`,
      [empleadoId]
    );
    return result.rows.length > 0 ? new Usuario(result.rows[0]) : null;
  }

  /**
   * Actualizar fecha de último acceso
   */
  async actualizarUltimoAcceso(empleadoId) {
    await pool.query(
      'UPDATE usuarios SET updated_at = CURRENT_TIMESTAMP WHERE empleado_id = $1',
      [empleadoId]
    );
  }
}

module.exports = new UsuarioRepository();
