const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_PORT = Number(process.env.DB_PORT || 5432);

const HOST_CANDIDATES = [
  'database-empleados',
  'database-auth',
  'database-perfiles',
  'database-notificaciones',
  'database-departamentos',
  'localhost'
];

async function connectWithFallback(database, preferredHost) {
  const hosts = [preferredHost, ...HOST_CANDIDATES.filter((h) => h !== preferredHost)];
  let lastError = null;

  for (const host of hosts) {
    const client = new Client({
      host,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database,
      connectionTimeoutMillis: 2000
    });

    try {
      await client.connect();
      return client;
    } catch (error) {
      lastError = error;
      try {
        await client.end();
      } catch (_) {
        // Ignored: cleanup best effort.
      }
    }
  }

  throw new Error(`No se pudo conectar a ${database}: ${lastError ? lastError.message : 'sin detalle'}`);
}

async function executeCleanup({ database, host, statements, logger }) {
  const client = await connectWithFallback(database, host);

  try {
    await client.query('BEGIN');
    for (const stmt of statements) {
      await client.query(stmt);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }

  if (logger) {
    logger(`Limpieza aplicada en ${database}`);
  }
}

async function cleanupE2eTestData(logger = null) {
  // El orden evita dejar rastros de eventos ya propagados en otros servicios.
  const plan = [
    {
      database: 'notificaciones_db',
      host: 'database-notificaciones',
      statements: [
        "DELETE FROM notificaciones WHERE destinatario LIKE 'test-%@empresa.com' OR destinatario LIKE 'user-%@empresa.com';",
        "DO $$ BEGIN IF pg_get_serial_sequence('notificaciones', 'id') IS NOT NULL THEN PERFORM setval(pg_get_serial_sequence('notificaciones', 'id'), COALESCE((SELECT MAX(id) FROM notificaciones), 0) + 1, false); END IF; END $$;"
      ]
    },
    {
      database: 'perfiles_db',
      host: 'database-perfiles',
      statements: [
        "DELETE FROM perfiles WHERE email LIKE 'test-%@empresa.com' OR email LIKE 'user-%@empresa.com';",
        "DO $$ BEGIN IF pg_get_serial_sequence('perfiles', 'id') IS NOT NULL THEN PERFORM setval(pg_get_serial_sequence('perfiles', 'id'), COALESCE((SELECT MAX(id) FROM perfiles), 0) + 1, false); END IF; END $$;"
      ]
    },
    {
      database: 'auth_db',
      host: 'database-auth',
      statements: [
        "DELETE FROM usuarios WHERE email LIKE 'test-%@empresa.com' OR email LIKE 'user-%@empresa.com';",
        "DO $$ BEGIN IF pg_get_serial_sequence('usuarios', 'id') IS NOT NULL THEN PERFORM setval(pg_get_serial_sequence('usuarios', 'id'), COALESCE((SELECT MAX(id) FROM usuarios), 0) + 1, false); END IF; END $$;"
      ]
    },
    {
      database: 'empleados_db',
      host: 'database-empleados',
      statements: [
        "DELETE FROM empleados WHERE email LIKE 'test-%@empresa.com' OR email LIKE 'user-%@empresa.com';",
        "DO $$ BEGIN IF pg_get_serial_sequence('empleados', 'id') IS NOT NULL THEN PERFORM setval(pg_get_serial_sequence('empleados', 'id'), COALESCE((SELECT MAX(id) FROM empleados), 0) + 1, false); END IF; END $$;"
      ]
    },
    {
      database: 'departamentos_db',
      host: 'database-departamentos',
      statements: [
        "DELETE FROM departamentos WHERE nombre LIKE 'ONB-%' OR nombre LIKE 'OFF-%' OR nombre LIKE 'Seguridad-%';",
        "DO $$ BEGIN IF pg_get_serial_sequence('departamentos', 'id') IS NOT NULL THEN PERFORM setval(pg_get_serial_sequence('departamentos', 'id'), COALESCE((SELECT MAX(id) FROM departamentos), 0) + 1, false); END IF; END $$;"
      ]
    }
  ];

  for (const task of plan) {
    await executeCleanup({
      database: task.database,
      host: task.host,
      statements: task.statements,
      logger
    });
  }
}

module.exports = {
  cleanupE2eTestData
};
