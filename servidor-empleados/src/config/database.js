/**
 * Configuracion de la base de datos PostgreSQL
 */
const { Pool } = require('pg');

// Configuracion de conex a PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'empleados_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20, // NNumero maximo de clientes en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Probar la conexion
pool.on('connect', () => {
  console.log('Conectado a la base de datos PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Error inesperado en la conexion a la base de datos:', err);
  process.exit(-1);
});

/**
 * Ejecuta una consulta SQL
 * @param {string} text - Query SQL
 * @param {Array} params - Parametros de la query
 */
const query = (text, params) => pool.query(text, params);

/**
 * Obtiene un cliente del pool para transacciones
 */
const getClient = () => pool.connect();

module.exports = {
  query,
  getClient,
  pool
};
