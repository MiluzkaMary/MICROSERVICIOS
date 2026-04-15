/**
 * Repositorio para operaciones de base de datos de Notificaciones
 */
const pool = require('../config/database');
const Notificacion = require('../models/notificacion');

class NotificacionRepository {
  /**
   * Busca todas las notificaciones
   */
  async findAll() {
    const query = 'SELECT * FROM notificaciones ORDER BY fecha_envio DESC';
    const result = await pool.query(query);
    return result.rows.map(row => new Notificacion(row));
  }

  /**
   * Obtiene notificaciones con paginación y filtrado
   * @param {Object} opciones - Opciones de paginación y filtrado
   * @returns {Promise<Object>} Objeto con datos y metadata de paginación
   */
  async obtenerConPaginacion(opciones = {}) {
    const {
      page = 1,
      size = 10,
      sortBy = 'fecha_envio',
      order = 'DESC',
      q,
      tipo,
      estado,
      empleadoId,
      destinatario
    } = opciones;

    // Construir la cláusula WHERE dinámicamente
    const condiciones = [];
    const valores = [];
    let paramIndex = 1;

    // Búsqueda general con parámetro 'q' en múltiples campos
    if (q) {
      condiciones.push(`(
        destinatario ILIKE $${paramIndex} OR 
        mensaje ILIKE $${paramIndex} OR
        empleado_id ILIKE $${paramIndex}
      )`);
      valores.push(`%${q}%`);
      paramIndex++;
    }

    if (tipo) {
      condiciones.push(`tipo = $${paramIndex}`);
      valores.push(tipo.toUpperCase());
      paramIndex++;
    }

    if (estado) {
      condiciones.push(`estado = $${paramIndex}`);
      valores.push(estado.toUpperCase());
      paramIndex++;
    }

    if (empleadoId) {
      condiciones.push(`empleado_id = $${paramIndex}`);
      valores.push(empleadoId);
      paramIndex++;
    }

    if (destinatario) {
      condiciones.push(`destinatario ILIKE $${paramIndex}`);
      valores.push(`%${destinatario}%`);
      paramIndex++;
    }

    const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

    // Validar campo de ordenamiento para prevenir SQL injection
    const camposPermitidos = ['id', 'tipo', 'destinatario', 'empleado_id', 'estado', 'fecha_envio'];
    const campoOrden = camposPermitidos.includes(sortBy) ? sortBy : 'fecha_envio';
    const direccionOrden = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Consulta para contar el total de registros
    const countQuery = `SELECT COUNT(*) as total FROM notificaciones ${whereClause}`;
    const countResult = await pool.query(countQuery, valores);
    const totalRegistros = parseInt(countResult.rows[0].total);

    // Calcular offset
    const offset = (page - 1) * size;

    // Consulta para obtener los datos paginados
    const dataQuery = `
      SELECT * FROM notificaciones
      ${whereClause}
      ORDER BY ${campoOrden} ${direccionOrden}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const dataResult = await pool.query(dataQuery, [...valores, size, offset]);

    // Calcular metadata
    const totalPaginas = Math.max(Math.ceil(totalRegistros / size), 1);

    return {
      items: dataResult.rows.map(row => new Notificacion(row)),
      page,
      size,
      totalRecords: totalRegistros,
      totalPages: totalPaginas
    };
  }

  /**
   * Busca notificaciones por empleadoId
   */
  async findByEmpleadoId(empleadoId) {
    const query = 'SELECT * FROM notificaciones WHERE empleado_id = $1 ORDER BY fecha_envio DESC';
    const result = await pool.query(query, [empleadoId]);
    return result.rows.map(row => new Notificacion(row));
  }

  /**
   * Busca notificaciones por tipo
   */
  async findByTipo(tipo) {
    const query = 'SELECT * FROM notificaciones WHERE tipo = $1 ORDER BY fecha_envio DESC';
    const result = await pool.query(query, [tipo.toUpperCase()]);
    return result.rows.map(row => new Notificacion(row));
  }

  /**
   * Crea una nueva notificación
   */
  async create(notificacion) {
    const query = `
      INSERT INTO notificaciones (tipo, destinatario, mensaje, empleado_id, estado)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      notificacion.tipo,
      notificacion.destinatario,
      notificacion.mensaje,
      notificacion.empleadoId,
      notificacion.estado
    ];
    const result = await pool.query(query, values);
    return new Notificacion(result.rows[0]);
  }

  /**
   * Actualiza el estado de una notificación
   */
  async updateEstado(id, estado) {
    const query = `
      UPDATE notificaciones 
      SET estado = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [estado, id]);
    return result.rows.length > 0 ? new Notificacion(result.rows[0]) : null;
  }

  /**
   * Cuenta notificaciones por empleado
   */
  async countByEmpleadoId(empleadoId) {
    const query = 'SELECT COUNT(*) as total FROM notificaciones WHERE empleado_id = $1';
    const result = await pool.query(query, [empleadoId]);
    return parseInt(result.rows[0].total, 10);
  }

  /**
   * Obtiene estadísticas generales
   */
  async getEstadisticas() {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN tipo = 'BIENVENIDA' THEN 1 END) as bienvenidas,
        COUNT(CASE WHEN tipo = 'DESVINCULACION' THEN 1 END) as desvinculaciones,
        COUNT(CASE WHEN tipo = 'ACTIVACION' THEN 1 END) as activaciones,
        COUNT(CASE WHEN estado = 'ENVIADA' THEN 1 END) as enviadas,
        COUNT(CASE WHEN estado = 'FALLIDA' THEN 1 END) as fallidas,
        COUNT(CASE WHEN estado = 'PENDIENTE' THEN 1 END) as pendientes
      FROM notificaciones
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }
}

module.exports = new NotificacionRepository();
