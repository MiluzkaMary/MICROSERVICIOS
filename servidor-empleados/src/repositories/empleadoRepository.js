
const db = require('../config/database');
const Empleado = require('../models/empleado');

class EmpleadoRepository {
  /**
   * Crea un nuevo empleado en la base de datos
   * @param {Empleado} empleado 
   * @returns {Promise<Empleado>} Empleado creado
   */
  async crear(empleado) {
    const query = `
      INSERT INTO empleados (id, nombre, email, departamento_id, fecha_ingreso)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      empleado.id,
      empleado.nombre,
      empleado.email,
      empleado.departamentoId,
      empleado.fechaIngreso
    ];

    const result = await db.query(query, values);
    return this._mapearEmpleado(result.rows[0]);
  }

  /**
   * Busca un empleado por ID
   * @param {string} id - ID del empleado
   * @returns {Promise<Empleado|null>} Empleado encontrado o null
   */
  async buscarPorId(id) {
    const query = 'SELECT * FROM empleados WHERE id = $1';
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this._mapearEmpleado(result.rows[0]);
  }

  /**
   * Busca un empleado por email
   * @param {string} email - Email del empleado
   * @returns {Promise<Empleado|null>} Empleado encontrado o null
   */
  async buscarPorEmail(email) {
    const query = 'SELECT * FROM empleados WHERE email = $1';
    const result = await db.query(query, [email]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this._mapearEmpleado(result.rows[0]);
  }

  /**
   * Obtiene todos los empleados
   * @returns {Promise<Array<Empleado>>} Lista de empleados
   */
  async obtenerTodos() {
    const query = 'SELECT * FROM empleados ORDER BY id';
    const result = await db.query(query);
    
    return result.rows.map(row => this._mapearEmpleado(row));
  }

  /**
   * Obtiene empleados con paginación y filtrado
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
      nombre,
      departamentoId
    } = opciones;

    // Construir la cláusula WHERE dinámicamente
    const condiciones = [];
    const valores = [];
    let paramIndex = 1;

    // Búsqueda general con parámetro 'q' en múltiples campos
    if (q) {
      condiciones.push(`(
        nombre ILIKE $${paramIndex} OR 
        email ILIKE $${paramIndex}
      )`);
      valores.push(`%${q}%`);
      paramIndex++;
    }

    if (nombre) {
      condiciones.push(`nombre ILIKE $${paramIndex}`);
      valores.push(`%${nombre}%`);
      paramIndex++;
    }

    if (departamentoId) {
      condiciones.push(`departamento_id = $${paramIndex}`);
      valores.push(departamentoId);
      paramIndex++;
    }

    const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

    // Validar campo de ordenamiento para prevenir SQL injection
    const camposPermitidos = ['id', 'nombre', 'email', 'departamento_id', 'fecha_ingreso'];
    const campoOrden = camposPermitidos.includes(sortBy) ? sortBy : 'id';
    const direccionOrden = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Consulta para contar el total de registros
    const countQuery = `SELECT COUNT(*) as total FROM empleados ${whereClause}`;
    const countResult = await db.query(countQuery, valores);
    const totalRegistros = parseInt(countResult.rows[0].total);

    // Calcular offset
    const offset = (page - 1) * size;

    // Consulta para obtener los datos paginados
    const dataQuery = `
      SELECT * FROM empleados
      ${whereClause}
      ORDER BY ${campoOrden} ${direccionOrden}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const dataResult = await db.query(dataQuery, [...valores, size, offset]);

    // Calcular metadata
    const totalPaginas = Math.max(Math.ceil(totalRegistros / size), 1);

    return {
      items: dataResult.rows.map(row => this._mapearEmpleado(row)),
      page,
      size,
      totalRecords: totalRegistros,
      totalPages: totalPaginas
    };
  }

  /**
   * Actualiza un empleado
   * @param {string} id - ID del empleado
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Empleado|null>} Empleado actualizado o null
   */
  async actualizar(id, datos) {
    const query = `
      UPDATE empleados
      SET nombre = $1, email = $2, departamento_id = $3, fecha_ingreso = $4
      WHERE id = $5
      RETURNING *
    `;
    
    const values = [
      datos.nombre,
      datos.email,
      datos.departamentoId,
      datos.fechaIngreso,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this._mapearEmpleado(result.rows[0]);
  }

  /**
   * Elimina un empleado
   * @param {string} id - ID del empleado
   * @returns {Promise<boolean>} true si se eliminó, false si no existía
   */
  async eliminar(id) {
    const query = 'DELETE FROM empleados WHERE id = $1';
    const result = await db.query(query, [id]);
    
    return result.rowCount > 0;
  }

  /**
   * Mapea una fila de la base de datos a un objeto Empleado
   * @private
   */
  _mapearEmpleado(row) {
    return new Empleado({
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      departamentoId: row.departamento_id,
      fechaIngreso: row.fecha_ingreso
    });
  }
}

module.exports = new EmpleadoRepository();
