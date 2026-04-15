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
   * Obtiene perfiles con paginación y filtrado
   * @param {Object} opciones - Opciones de paginación y filtrado
   * @returns {Promise<Object>} Objeto con datos y metadata de paginación
   */
  async obtenerConPaginacion(opciones = {}) {
    const {
      page = 1,
      size = 10,
      sortBy = 'fecha_creacion',
      order = 'DESC',
      q,
      nombre,
      email,
      ciudad
    } = opciones;

    // Construir la cláusula WHERE dinámicamente
    const condiciones = [];
    const valores = [];
    let paramIndex = 1;

    // Búsqueda general con parámetro 'q' en múltiples campos
    if (q) {
      condiciones.push(`(
        nombre ILIKE $${paramIndex} OR 
        email ILIKE $${paramIndex} OR
        ciudad ILIKE $${paramIndex}
      )`);
      valores.push(`%${q}%`);
      paramIndex++;
    }

    if (nombre) {
      condiciones.push(`nombre ILIKE $${paramIndex}`);
      valores.push(`%${nombre}%`);
      paramIndex++;
    }

    if (email) {
      condiciones.push(`email ILIKE $${paramIndex}`);
      valores.push(`%${email}%`);
      paramIndex++;
    }

    if (ciudad) {
      condiciones.push(`ciudad ILIKE $${paramIndex}`);
      valores.push(`%${ciudad}%`);
      paramIndex++;
    }

    const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

    // Validar campo de ordenamiento para prevenir SQL injection
    const camposPermitidos = ['empleado_id', 'nombre', 'email', 'ciudad', 'fecha_creacion'];
    const campoOrden = camposPermitidos.includes(sortBy) ? sortBy : 'fecha_creacion';
    const direccionOrden = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Consulta para contar el total de registros
    const countQuery = `SELECT COUNT(*) as total FROM perfiles ${whereClause}`;
    const countResult = await pool.query(countQuery, valores);
    const totalRegistros = parseInt(countResult.rows[0].total);

    // Calcular offset
    const offset = (page - 1) * size;

    // Consulta para obtener los datos paginados
    const dataQuery = `
      SELECT * FROM perfiles
      ${whereClause}
      ORDER BY ${campoOrden} ${direccionOrden}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const dataResult = await pool.query(dataQuery, [...valores, size, offset]);

    // Calcular metadata
    const totalPaginas = Math.max(Math.ceil(totalRegistros / size), 1);

    return {
      items: dataResult.rows.map(row => new Perfil(row)),
      page,
      size,
      totalRecords: totalRegistros,
      totalPages: totalPaginas
    };
  }

  /**
   * Crea un nuevo perfil
   */
  async create(perfil) {
    const query = `
      INSERT INTO perfiles (empleado_id, nombre, email, telefono, direccion, ciudad, biografia, activo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      perfil.empleadoId,
      perfil.nombre,
      perfil.email,
      perfil.telefono,
      perfil.direccion,
      perfil.ciudad,
      perfil.biografia,
      perfil.activo
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
   * Desactiva un perfil por empleadoId
   */
  async desactivarByEmpleadoId(empleadoId) {
    const query = `
      UPDATE perfiles
      SET activo = false,
          fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE empleado_id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [empleadoId]);
    return result.rows.length > 0 ? new Perfil(result.rows[0]) : null;
  }

  /**
   * Reactiva un perfil por empleadoId
   */
  async reactivarByEmpleadoId(empleadoId) {
    const query = `
      UPDATE perfiles
      SET activo = true,
          fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE empleado_id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [empleadoId]);
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

  /**
   * Elimina un perfil por empleadoId
   */
}

module.exports = new PerfilRepository();
