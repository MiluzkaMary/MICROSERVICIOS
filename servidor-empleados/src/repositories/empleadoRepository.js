
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
      INSERT INTO empleados (id, nombre, apellido, email, numero_empleado, cargo, area, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      empleado.id,
      empleado.nombre,
      empleado.apellido,
      empleado.email,
      empleado.numeroEmpleado,
      empleado.cargo,
      empleado.area,
      empleado.estado
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
   * Actualiza un empleado
   * @param {string} id - ID del empleado
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Empleado|null>} Empleado actualizado o null
   */
  async actualizar(id, datos) {
    const query = `
      UPDATE empleados
      SET nombre = $1, apellido = $2, email = $3, numero_empleado = $4,
          cargo = $5, area = $6, estado = $7
      WHERE id = $8
      RETURNING *
    `;
    
    const values = [
      datos.nombre,
      datos.apellido,
      datos.email,
      datos.numeroEmpleado,
      datos.cargo,
      datos.area,
      datos.estado,
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
      apellido: row.apellido,
      email: row.email,
      numeroEmpleado: row.numero_empleado,
      cargo: row.cargo,
      area: row.area,
      estado: row.estado
    });
  }
}

module.exports = new EmpleadoRepository();
