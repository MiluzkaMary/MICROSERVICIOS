const db = require('../config/database');
const Departamento = require('../models/departamento');

class DepartamentoRepository {
  /**
   * Crea un nuevo departamento en la base de datos
   * @param {Departamento} departamento 
   * @returns {Promise<Departamento>} Departamento creado
   */
  async crear(departamento) {
    const result = await db.query(
      'INSERT INTO departamentos (nombre, descripcion) VALUES ($1, $2) RETURNING *',
      [departamento.nombre, departamento.descripcion]
    );
    return new Departamento(result.rows[0]);
  }

  /**
   * Busca un departamento por ID
   * @param {number} id - ID del departamento
   * @returns {Promise<Departamento|null>} Departamento encontrado o null
   */
  async buscarPorId(id) {
    const result = await db.query(
      'SELECT * FROM departamentos WHERE id = $1',
      [id]
    );
    return result.rows.length > 0 ? new Departamento(result.rows[0]) : null;
  }

  /**
   * Busca un departamento por nombre
   * @param {string} nombre - Nombre del departamento
   * @returns {Promise<Departamento|null>} Departamento encontrado o null
   */
  async buscarPorNombre(nombre) {
    const result = await db.query(
      'SELECT * FROM departamentos WHERE LOWER(nombre) = LOWER($1)',
      [nombre]
    );
    return result.rows.length > 0 ? new Departamento(result.rows[0]) : null;
  }

  /**
   * Obtiene todos los departamentos
   * @returns {Promise<Array<Departamento>>} Lista de departamentos
   */
  async obtenerTodos() {
    const result = await db.query('SELECT * FROM departamentos ORDER BY id ASC');
    return result.rows.map(row => new Departamento(row));
  }

  /**
   * Obtiene departamentos con paginación y filtrado
   * @param {Object} opciones - Opciones de paginación y filtrado
   * @returns {Promise<Object>} Objeto con datos y metadata de paginación
   */
  async obtenerConPaginacion(opciones = {}) {
    const {
      page = 1,
      size = 10,
      sortBy = 'id',
      order = 'ASC',
      q,
      nombre
    } = opciones;

    // Validar campos de ordenamiento permitidos
    const camposPermitidos = ['id', 'nombre', 'descripcion'];
    const campoOrden = camposPermitidos.includes(sortBy) ? sortBy : 'id';
    const direccionOrden = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Construir condiciones WHERE
    const condiciones = [];
    const params = [];
    let paramIndex = 1;

    // Búsqueda general
    if (q) {
      condiciones.push(`(LOWER(nombre) LIKE $${paramIndex} OR LOWER(descripcion) LIKE $${paramIndex})`);
      params.push(`%${q.toLowerCase()}%`);
      paramIndex++;
    }

    // Filtro por nombre específico
    if (nombre && !q) {
      condiciones.push(`LOWER(nombre) LIKE $${paramIndex}`);
      params.push(`%${nombre.toLowerCase()}%`);
      paramIndex++;
    }

    const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

    // Contar total de registros
    const countQuery = `SELECT COUNT(*) as total FROM departamentos ${whereClause}`;
    const countResult = await db.query(countQuery, params);
    const totalRecords = parseInt(countResult.rows[0].total, 10);

    // Calcular paginación
    const offset = (page - 1) * size;
    const totalPages = Math.ceil(totalRecords / size);

    // Obtener registros paginados
    const dataQuery = `
      SELECT * FROM departamentos
      ${whereClause}
      ORDER BY ${campoOrden} ${direccionOrden}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(size, offset);

    const dataResult = await db.query(dataQuery, params);
    const items = dataResult.rows.map(row => new Departamento(row));

    return {
      page,
      size,
      totalRecords,
      totalPages,
      items
    };
  }

  /**
   * Actualiza un departamento
   * @param {number} id - ID del departamento
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Departamento|null>} Departamento actualizado o null
   */
  async actualizar(id, datos) {
    const campos = [];
    const valores = [];
    let paramIndex = 1;

    if (datos.nombre !== undefined) {
      campos.push(`nombre = $${paramIndex++}`);
      valores.push(datos.nombre);
    }
    if (datos.descripcion !== undefined) {
      campos.push(`descripcion = $${paramIndex++}`);
      valores.push(datos.descripcion);
    }

    if (campos.length === 0) return null;

    valores.push(id);
    const result = await db.query(
      `UPDATE departamentos SET ${campos.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      valores
    );

    return result.rows.length > 0 ? new Departamento(result.rows[0]) : null;
  }

  /**
   * Elimina un departamento
   * @param {number} id - ID del departamento
   * @returns {Promise<boolean>} True si se eliminó, false si no
   */
  async eliminar(id) {
    const result = await db.query(
      'DELETE FROM departamentos WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }
}

module.exports = new DepartamentoRepository();
