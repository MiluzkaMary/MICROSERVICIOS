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
const QUEUE_USUARIO_CREADO = 'notificaciones.usuario_creado';
const QUEUE_USUARIO_RECUPERACION = 'notificaciones.usuario_recuperacion';
const ROUTING_KEY_CREADO = 'empleado.creado';
const ROUTING_KEY_ELIMINADO = 'empleado.eliminado';
const ROUTING_KEY_USUARIO_CREADO = 'usuario.creado';
const ROUTING_KEY_USUARIO_RECUPERACION = 'usuario.recuperacion';

/**
 * Conecta a RabbitMQ y configura los consumidores con reintentos
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

    // Declarar colas
    await channel.assertQueue(QUEUE_CREADO, { durable: true });
    await channel.assertQueue(QUEUE_ELIMINADO, { durable: true });
    await channel.assertQueue(QUEUE_USUARIO_CREADO, { durable: true });
    await channel.assertQueue(QUEUE_USUARIO_RECUPERACION, { durable: true });

    // Vincular colas al exchange
    await channel.bindQueue(QUEUE_CREADO, EXCHANGE_NAME, ROUTING_KEY_CREADO);
    await channel.bindQueue(QUEUE_ELIMINADO, EXCHANGE_NAME, ROUTING_KEY_ELIMINADO);
    await channel.bindQueue(QUEUE_USUARIO_CREADO, EXCHANGE_NAME, ROUTING_KEY_USUARIO_CREADO);
    await channel.bindQueue(QUEUE_USUARIO_RECUPERACION, EXCHANGE_NAME, ROUTING_KEY_USUARIO_RECUPERACION);

    // Configurar prefetch
    await channel.prefetch(1);

    console.log('✅ Conectado a RabbitMQ');
    console.log(`🎯 Escuchando eventos: ${ROUTING_KEY_CREADO}, ${ROUTING_KEY_ELIMINADO}, ${ROUTING_KEY_USUARIO_CREADO}, ${ROUTING_KEY_USUARIO_RECUPERACION}`);

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

    // Consumir eventos de usuario.creado (activación)
    channel.consume(QUEUE_USUARIO_CREADO, async (mensaje) => {
      if (mensaje !== null) {
        try {
          const contenido = JSON.parse(mensaje.content.toString());
          console.log(`📨 Evento recibido: ${ROUTING_KEY_USUARIO_CREADO}`, contenido);

          // Procesar evento
          await procesarUsuarioCreado(contenido);

          // Confirmar mensaje
          channel.ack(mensaje);
          console.log('✅ Mensaje procesado exitosamente');
        } catch (error) {
          console.error('❌ Error al procesar mensaje usuario.creado:', error.message);
          // Rechazar mensaje
          channel.nack(mensaje, false, false);
        }
      }
    });

    // Consumir eventos de usuario.recuperacion (recuperación de contraseña)
    channel.consume(QUEUE_USUARIO_RECUPERACION, async (mensaje) => {
      if (mensaje !== null) {
        try {
          const contenido = JSON.parse(mensaje.content.toString());
          console.log(`📨 Evento recibido: ${ROUTING_KEY_USUARIO_RECUPERACION}`, contenido);

          // Procesar evento
          await procesarUsuarioRecuperacion(contenido);

          // Confirmar mensaje
          channel.ack(mensaje);
          console.log('✅ Mensaje procesado exitosamente');
        } catch (error) {
          console.error('❌ Error al procesar mensaje usuario.recuperacion:', error.message);
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

/** * Procesa el evento usuario.creado (activación)
 */
async function procesarUsuarioCreado(evento) {
  const { empleadoId, email, token, nombre } = evento;
  
  console.log(`📧 Procesando email de activación para: ${empleadoId}`);
  console.log(`[NOTIFICACIÓN] Tipo: ACTIVACIÓN | Para: ${email} | Token: ${token.substring(0, 10)}...`);
  
  const resultado = await notificacionService.procesarUsuarioCreado(empleadoId, email, token, nombre);
  
  if (resultado.success) {
    console.log(`✅ Email de activación procesado para ${empleadoId}`);
  } else {
    console.error(`❌ Error al procesar email de activación para ${empleadoId}:`, resultado.message);
    throw new Error(resultado.message);
  }
}

/** * Procesa el evento empleado.eliminado
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
 * Procesa el evento usuario.recuperacion (recuperación de contraseña)
 */
async function procesarUsuarioRecuperacion(evento) {
  const { empleadoId, email, token } = evento;
  
  console.log(`📧 Procesando email de recuperación de contraseña para: ${empleadoId}`);
  console.log(`[NOTIFICACIÓN] Tipo: RECUPERACIÓN | Para: ${email} | Token: ${token.substring(0, 10)}...`);
  
  const resultado = await notificacionService.procesarUsuarioRecuperacion(empleadoId, email, token);
  
  if (resultado.success) {
    console.log(`✅ Email de recuperación procesado para ${empleadoId}`);
  } else {
    console.error(`❌ Error al procesar email de recuperación para ${empleadoId}:`, resultado.message);
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
