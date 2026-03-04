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
const QUEUE_EMPLEADO_CREADO = 'perfiles.empleado_creado';
const QUEUE_EMPLEADO_ELIMINADO = 'perfiles.empleado_eliminado';
const ROUTING_KEY_CREADO = 'empleado.creado';
const ROUTING_KEY_ELIMINADO = 'empleado.eliminado';

/**
 * Conecta a RabbitMQ y configura el consumidor con reintentos
 */
async function connect(retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const url = `amqp://${RABBITMQ_CONFIG.user}:${RABBITMQ_CONFIG.password}@${RABBITMQ_CONFIG.host}:${RABBITMQ_CONFIG.port}`;
      
      connection = await amqp.connect(url);
      channel = await connection.createChannel();

      // Declarar exchange (debe existir, lo crea el servicio de empleados)
      await channel.assertExchange(EXCHANGE_NAME, 'topic', {
        durable: true
      });

      // Declarar cola para empleado.creado
      await channel.assertQueue(QUEUE_EMPLEADO_CREADO, {
        durable: true
      });

      // Vincular cola al exchange con routing key empleado.creado
      await channel.bindQueue(QUEUE_EMPLEADO_CREADO, EXCHANGE_NAME, ROUTING_KEY_CREADO);

      // Declarar cola para empleado.eliminado
      await channel.assertQueue(QUEUE_EMPLEADO_ELIMINADO, {
        durable: true
      });

      // Vincular cola al exchange con routing key empleado.eliminado
      await channel.bindQueue(QUEUE_EMPLEADO_ELIMINADO, EXCHANGE_NAME, ROUTING_KEY_ELIMINADO);

      // Configurar prefetch (procesar 1 mensaje a la vez)
      await channel.prefetch(1);

      console.log('✅ Conectado a RabbitMQ');
      console.log(`🎯 Escuchando eventos: ${ROUTING_KEY_CREADO}, ${ROUTING_KEY_ELIMINADO}`);

      // Consumir mensajes de empleado.creado
      channel.consume(QUEUE_EMPLEADO_CREADO, async (mensaje) => {
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
            console.error('❌ Error al procesar mensaje:', error.message);
            // Rechazar mensaje y no re-encolar (enviar a DLQ si está configurado)
            channel.nack(mensaje, false, false);
          }
        }
      });

      // Consumir mensajes de empleado.eliminado
      channel.consume(QUEUE_EMPLEADO_ELIMINADO, async (mensaje) => {
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
      console.warn(`⚠️ Intento ${i + 1}/${retries} - Error al conectar a RabbitMQ: ${error.message}`);
      if (i < retries - 1) {
        console.log(`⏳ Esperando ${delay}ms antes de reintentar...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('❌ No se pudo conectar a RabbitMQ después de varios intentos');
        throw error;
      }
    }
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
 * Procesa el evento empleado.eliminado
 */
async function procesarEmpleadoEliminado(evento) {
  const { empleadoId, nombre, email } = evento;
  
  console.log(`🗑️  Procesando eliminación de perfil para empleado: ${empleadoId} - ${nombre}`);
  
  const resultado = await perfilService.eliminarPerfilPorEmpleadoId(empleadoId);
  
  if (resultado.success) {
    console.log(`✅ Perfil eliminado exitosamente para ${nombre}`);
  } else {
    console.error(`❌ Error al eliminar perfil para ${nombre}:`, resultado.message);
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
