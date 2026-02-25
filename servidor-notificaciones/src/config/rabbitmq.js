/**
 * Configuración de RabbitMQ para Servicio de Notificaciones
 */
const amqp = require('amqplib');
const notificacionService = require('../services/notificacionService');

let connection = null;
let channel = null;

const RABBITMQ_CONFIG = {
  host: process.env.RABBITMQ_HOST || 'localhost',
  port: process.env.RABBITMQ_PORT || 5672,
  user: process.env.RABBITMQ_USER || 'guest',
  password: process.env.RABBITMQ_PASSWORD || 'guest'
};

const EXCHANGE_NAME = 'empleados_events';
const QUEUE_CREADO = 'notificaciones.empleado_creado';
const QUEUE_ELIMINADO = 'notificaciones.empleado_eliminado';
const ROUTING_KEY_CREADO = 'empleado.creado';
const ROUTING_KEY_ELIMINADO = 'empleado.eliminado';

/**
 * Conecta a RabbitMQ y configura los consumidores
 */
async function connect() {
  try {
    const url = `amqp://${RABBITMQ_CONFIG.user}:${RABBITMQ_CONFIG.password}@${RABBITMQ_CONFIG.host}:${RABBITMQ_CONFIG.port}`;
    
    connection = await amqp.connect(url);
    channel = await connection.createChannel();

    // Declarar exchange (debe existir, lo crea el servicio de empleados)
    await channel.assertExchange(EXCHANGE_NAME, 'topic', {
      durable: true
    });

    // Declarar colas
    await channel.assertQueue(QUEUE_CREADO, { durable: true });
    await channel.assertQueue(QUEUE_ELIMINADO, { durable: true });

    // Vincular colas al exchange
    await channel.bindQueue(QUEUE_CREADO, EXCHANGE_NAME, ROUTING_KEY_CREADO);
    await channel.bindQueue(QUEUE_ELIMINADO, EXCHANGE_NAME, ROUTING_KEY_ELIMINADO);

    // Configurar prefetch
    await channel.prefetch(1);

    console.log('✅ Conectado a RabbitMQ');
    console.log(`🎯 Escuchando eventos: ${ROUTING_KEY_CREADO}, ${ROUTING_KEY_ELIMINADO}`);

    // Consumir eventos de empleado.creado
    channel.consume(QUEUE_CREADO, async (mensaje) => {
      if (mensaje !== null) {
        try {
          const contenido = JSON.parse(mensaje.content.toString());
          console.log(`📨 Evento recibido: ${ROUTING_KEY_CREADO}`, contenido);

          // Procesar evento
          await procesarEmpleadoCreado(contenido);

          // Confirmar mensaje
          channel.ack(mensaje);
          console.log('✅ Mensaje procesado exitosamente');
        } catch (error) {
          console.error('❌ Error al procesar mensaje empleado.creado:', error.message);
          // Rechazar mensaje
          channel.nack(mensaje, false, false);
        }
      }
    });

    // Consumir eventos de empleado.eliminado
    channel.consume(QUEUE_ELIMINADO, async (mensaje) => {
      if (mensaje !== null) {
        try {
          const contenido = JSON.parse(mensaje.content.toString());
          console.log(`📨 Evento recibido: ${ROUTING_KEY_ELIMINADO}`, contenido);

          // Procesar evento
          await procesarEmpleadoEliminado(contenido);

          // Confirmar mensaje
          channel.ack(mensaje);
          console.log('✅ Mensaje procesado exitosamente');
        } catch (error) {
          console.error('❌ Error al procesar mensaje empleado.eliminado:', error.message);
          // Rechazar mensaje
          channel.nack(mensaje, false, false);
        }
      }
    });

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
 * Procesa el evento empleado.creado
 */
async function procesarEmpleadoCreado(evento) {
  const { empleadoId, nombre, email } = evento;
  
  console.log(`📧 Procesando notificación de bienvenida para: ${empleadoId} - ${nombre}`);
  console.log(`[NOTIFICACIÓN] Tipo: BIENVENIDA | Para: ${email} | Mensaje: "Bienvenido ${nombre}..."`);
  
  const resultado = await notificacionService.procesarEmpleadoCreado(empleadoId, nombre, email);
  
  if (resultado.success) {
    console.log(`✅ Notificación de bienvenida procesada para ${nombre}`);
  } else {
    console.error(`❌ Error al procesar notificación para ${nombre}:`, resultado.message);
    throw new Error(resultado.message);
  }
}

/**
 * Procesa el evento empleado.eliminado
 */
async function procesarEmpleadoEliminado(evento) {
  const { empleadoId, nombre, email } = evento;
  
  console.log(`📧 Procesando notificación de desvinculación para: ${empleadoId} - ${nombre}`);
  console.log(`[NOTIFICACIÓN] Tipo: DESVINCULACIÓN | Para: ${email} | Mensaje: "Su cuenta ha sido eliminada. ${nombre}..."`);
  
  const resultado = await notificacionService.procesarEmpleadoDesvinculado(empleadoId, nombre, email);
  
  if (resultado.success) {
    console.log(`✅ Notificación de desvinculación procesada para ${nombre}`);
  } else {
    console.error(`❌ Error al procesar notificación para ${nombre}:`, resultado.message);
    throw new Error(resultado.message);
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
  close
};
