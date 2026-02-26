/**
 * Configuración de RabbitMQ
 */
const amqp = require('amqplib');

let connection = null;
let channel = null;

const RABBITMQ_CONFIG = {
  host: process.env.RABBITMQ_HOST || 'localhost',
  port: process.env.RABBITMQ_PORT || 5672,
  user: process.env.RABBITMQ_USER || 'guest',
  password: process.env.RABBITMQ_PASSWORD || 'guest'
};

const EXCHANGE_NAME = 'empleados_events';
const EXCHANGE_TYPE = 'topic';

/**
 * Conecta a RabbitMQ
 */
async function connect() {
  try {
    const url = `amqp://${RABBITMQ_CONFIG.user}:${RABBITMQ_CONFIG.password}@${RABBITMQ_CONFIG.host}:${RABBITMQ_CONFIG.port}`;
    
    connection = await amqp.connect(url);
    channel = await connection.createChannel();

    // Declarar exchange de tipo topic
    await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, {
      durable: true
    });

    console.log('✅ Conectado a RabbitMQ');
    console.log(`📡 Exchange "${EXCHANGE_NAME}" (${EXCHANGE_TYPE}) declarado`);

    // Manejar errores de conexión
    connection.on('error', (err) => {
      console.error('❌ Error de conexión RabbitMQ:', err.message);
    });

    connection.on('close', () => {
      console.warn('⚠️ Conexión a RabbitMQ cerrada');
    });

    return channel;
  } catch (error) {
    console.error('❌ Error al conectar a RabbitMQ:', error.message);
    throw error;
  }
}

/**
 * Publica un evento en RabbitMQ
 * @param {string} routingKey - Clave de enrutamiento (ej: 'empleado.creado', 'empleado.eliminado')
 * @param {object} mensaje - Datos del evento
 */
async function publicarEvento(routingKey, mensaje) {
  try {
    if (!channel) {
      await connect();
    }

    const contenido = Buffer.from(JSON.stringify(mensaje));
    
    channel.publish(EXCHANGE_NAME, routingKey, contenido, {
      persistent: true, // Los mensajes sobreviven a reinicios de RabbitMQ
      contentType: 'application/json',
      timestamp: Date.now()
    });

    console.log(`📤 Evento publicado: ${routingKey}`, mensaje);
    return true;
  } catch (error) {
    console.error(`❌ Error al publicar evento ${routingKey}:`, error.message);
    return false;
  }
}

/**
 * Cierra la conexión a RabbitMQ
 */
async function close() {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    console.log('🔌 Conexión a RabbitMQ cerrada');
  } catch (error) {
    console.error('❌ Error al cerrar conexión RabbitMQ:', error.message);
  }
}

module.exports = {
  connect,
  publicarEvento,
  close,
  EXCHANGE_NAME
};
