/**
 * Configuración de RabbitMQ para Servicio de Perfiles
 */
const amqp = require('amqplib');
const perfilService = require('../services/perfilService');

let connection = null;
let channel = null;

const RABBITMQ_CONFIG = {
  host: process.env.RABBITMQ_HOST || 'localhost',
  port: process.env.RABBITMQ_PORT || 5672,
  user: process.env.RABBITMQ_USER || 'guest',
  password: process.env.RABBITMQ_PASSWORD || 'guest'
};

const EXCHANGE_NAME = 'empleados_events';
const QUEUE_NAME = 'perfiles.empleado_creado';
const ROUTING_KEY = 'empleado.creado';

/**
 * Conecta a RabbitMQ y configura el consumidor
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

    // Declarar cola
    await channel.assertQueue(QUEUE_NAME, {
      durable: true
    });

    // Vincular cola al exchange con routing key
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);

    // Configurar prefetch (procesar 1 mensaje a la vez)
    await channel.prefetch(1);

    console.log('✅ Conectado a RabbitMQ');
    console.log(`🎯 Escuchando eventos: ${ROUTING_KEY}`);

    // Consumir mensajes
    channel.consume(QUEUE_NAME, async (mensaje) => {
      if (mensaje !== null) {
        try {
          const contenido = JSON.parse(mensaje.content.toString());
          console.log(`📨 Evento recibido: ${ROUTING_KEY}`, contenido);

          // Procesar evento
          await procesarEmpleadoCreado(contenido);

          // Confirmar mensaje
          channel.ack(mensaje);
          console.log('✅ Mensaje procesado exitosamente');
        } catch (error) {
          console.error('❌ Error al procesar mensaje:', error.message);
          // Rechazar mensaje y no re-encolar (enviar a DLQ si está configurado)
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
  
  console.log(`👤 Procesando creación de perfil para empleado: ${empleadoId} - ${nombre}`);
  
  const resultado = await perfilService.crearPerfilDefault(empleadoId, nombre, email);
  
  if (resultado.success) {
    console.log(`✅ Perfil creado exitosamente para ${nombre}`);
  } else {
    console.error(`❌ Error al crear perfil para ${nombre}:`, resultado.message);
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
