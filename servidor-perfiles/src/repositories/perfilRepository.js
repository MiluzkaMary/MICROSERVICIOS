/**
 * Repositorio para operaciones de base de datos de Perfiles
 */
const pool = require('../config/database');
const Perfil = require('../models/perfil');

class PerfilRepository {
  /**
   * Busca un perfil por empleadoId
   */
  async findByEmpleadoId(empleadoId) {
    const query = 'SELECT * FROM perfiles WHERE empleado_id = $1';
    const result = await pool.query(query, [empleadoId]);
    return result.rows.length > 0 ? new Perfil(result.rows[0]) : null;
  }

  /**
   * Busca todos los perfiles
   */
  async findAll() {
    const query = 'SELECT * FROM perfiles ORDER BY fecha_creacion DESC';
    const result = await pool.query(query);
    return result.rows.map(row => new Perfil(row));
  }

  /**
   * Crea un nuevo perfil
   */
  async create(perfil) {
    const query = `
      INSERT INTO perfiles (empleado_id, nombre, email, telefono, direccion, ciudad, biografia)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      perfil.empleadoId,
      perfil.nombre,
      perfil.email,
      perfil.telefono,
      perfil.direccion,
      perfil.ciudad,
      perfil.biografia
    ];
    const result = await pool.query(query, values);
    return new Perfil(result.rows[0]);
  }

  /**
   * Actualiza un perfil existente por empleadoId
   */
  async updateByEmpleadoId(empleadoId, perfil) {
    const query = `
      UPDATE perfiles 
      SET telefono = $1, direccion = $2, ciudad = $3, biografia = $4
      WHERE empleado_id = $5
      RETURNING *
    `;
    const values = [
      perfil.telefono,
      perfil.direccion,
      perfil.ciudad,
      perfil.biografia,
      empleadoId
    ];
    const result = await pool.query(query, values);
    return result.rows.length > 0 ? new Perfil(result.rows[0]) : null;
  }

  /**
   * Verifica si existe un perfil por empleadoId
   */
  async existsByEmpleadoId(empleadoId) {
    const query = 'SELECT EXISTS(SELECT 1 FROM perfiles WHERE empleado_id = $1)';
    const result = await pool.query(query, [empleadoId]);
    return result.rows[0].exists;
  }

  /**
   * Verifica si existe un perfil por email
   */
  async existsByEmail(email) {
    const query = 'SELECT EXISTS(SELECT 1 FROM perfiles WHERE email = $1)';
    const result = await pool.query(query, [email]);
    return result.rows[0].exists;
  }
}

module.exports = new PerfilRepository();
