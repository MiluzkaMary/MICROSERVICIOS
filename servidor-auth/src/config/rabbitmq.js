/**
 * Configuración de RabbitMQ
 * Consumer de eventos de empleados y publisher de eventos de usuarios
 */
const amqp = require('amqplib');
const authService = require('../services/authService');

const RABBITMQ_CONFIG = {
  host: process.env.RABBITMQ_HOST || 'localhost',
  port: process.env.RABBITMQ_PORT || 5672,
  user: process.env.RABBITMQ_USER || 'guest',
  password: process.env.RABBITMQ_PASSWORD || 'guest'
};

const EXCHANGE = 'empleados_events'; // Reutilizamos el exchange existente
const QUEUE_EMPLEADO_CREADO = 'auth.empleado_creado';
const QUEUE_EMPLEADO_ELIMINADO = 'auth.empleado_eliminado';

let connection = null;
let channel = null;

/**
 * Conectar a RabbitMQ y configurar consumers
 */
async function connect() {
  try {
    // Establecer conexión
    const url = `amqp://${RABBITMQ_CONFIG.user}:${RABBITMQ_CONFIG.password}@${RABBITMQ_CONFIG.host}:${RABBITMQ_CONFIG.port}`;
    connection = await amqp.connect(url);
    channel = await connection.createChannel();

    console.log('✅ Conectado a RabbitMQ (Auth Service)');

    // Asegurar que el exchange existe (tipo topic)
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

    // Configurar consumer para empleado.creado
    await channel.assertQueue(QUEUE_EMPLEADO_CREADO, { durable: true });
    await channel.bindQueue(QUEUE_EMPLEADO_CREADO, EXCHANGE, 'empleado.creado');
    
    channel.consume(QUEUE_EMPLEADO_CREADO, async (msg) => {
      if (msg !== null) {
        try {
          const empleadoData = JSON.parse(msg.content.toString());
          console.log('📥 Evento recibido: empleado.creado', empleadoData);
          
          // Crear usuario y publicar evento usuario.creado
          await authService.handleEmpleadoCreado(empleadoData, channel, EXCHANGE);
          
          channel.ack(msg);
        } catch (error) {
          console.error('❌ Error procesando empleado.creado:', error);
          channel.nack(msg, false, false); // No reintenta, descarta
        }
      }
    });

    // Configurar consumer para empleado.eliminado
    await channel.assertQueue(QUEUE_EMPLEADO_ELIMINADO, { durable: true });
    await channel.bindQueue(QUEUE_EMPLEADO_ELIMINADO, EXCHANGE, 'empleado.eliminado');
    
    channel.consume(QUEUE_EMPLEADO_ELIMINADO, async (msg) => {
      if (msg !== null) {
        try {
          const empleadoData = JSON.parse(msg.content.toString());
          console.log('📥 Evento recibido: empleado.eliminado', empleadoData);
          
          await authService.handleEmpleadoEliminado(empleadoData);
          
          channel.ack(msg);
        } catch (error) {
          console.error('❌ Error procesando empleado.eliminado:', error);
          channel.nack(msg, false, false);
        }
      }
    });

    console.log('👂 Escuchando eventos: empleado.creado, empleado.eliminado');

  } catch (error) {
    console.error('❌ Error conectando a RabbitMQ:', error.message);
    throw error;
  }
}

/**
 * Publicar evento en RabbitMQ
 * @param {string} routingKey - Routing key del evento (ej: 'usuario.creado')
 * @param {object} data - Datos del evento
 */
async function publish(routingKey, data) {
  try {
    if (!channel) {
      throw new Error('Canal de RabbitMQ no disponible');
    }

    const message = JSON.stringify(data);
    channel.publish(EXCHANGE, routingKey, Buffer.from(message), {
      persistent: true
    });

    console.log(`📤 Evento publicado: ${routingKey}`, data);
  } catch (error) {
    console.error('❌ Error publicando evento:', error);
    throw error;
  }
}

/**
 * Desconectar de RabbitMQ
 */
async function disconnect() {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    console.log('✅ Desconectado de RabbitMQ');
  } catch (error) {
    console.error('❌ Error desconectando de RabbitMQ:', error);
  }
}

module.exports = {
  connect,
  publish,
  disconnect
};
