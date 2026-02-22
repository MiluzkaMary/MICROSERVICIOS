const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'departamentos_db',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

exports.crearDepartamento = async ({ nombre, descripcion }) => {
  const result = await pool.query(
    'INSERT INTO departamentos (nombre, descripcion) VALUES ($1, $2) RETURNING *',
    [nombre, descripcion]
  );
  return result.rows[0];
};

exports.listarDepartamentos = async () => {
  const result = await pool.query('SELECT * FROM departamentos');
  return result.rows;
};

exports.obtenerDepartamentoPorId = async (id) => {
  const result = await pool.query('SELECT * FROM departamentos WHERE id = $1', [id]);
  return result.rows[0];
};
