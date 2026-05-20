package com.empresa.notificaciones.messaging;

import com.empresa.notificaciones.config.RabbitMQConfig;
import com.empresa.notificaciones.service.NotificacionService;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Consumidor de eventos RabbitMQ para el Servicio de Notificaciones.
 * Equivalente a los channel.consume() en src/config/rabbitmq.js.
 */
@Component
public class NotificacionEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(NotificacionEventConsumer.class);

    private final NotificacionService notificacionService;

    public NotificacionEventConsumer(NotificacionService notificacionService) {
        this.notificacionService = notificacionService;
    }

    /**
     * Consume eventos: empleado.creado
     */
    @RabbitListener(queues = RabbitMQConfig.QUEUE_CREADO)
    public void onEmpleadoCreado(JsonNode json) {
        log.info("📨 Evento recibido: {} | payload: {}", RabbitMQConfig.RK_CREADO, json);
        try {
            String empleadoId = json.path("empleadoId").asText();
            String nombre     = json.path("nombre").asText();
            String email      = json.path("email").asText();

            log.info("📧 Procesando notificación de bienvenida para: {} - {}", empleadoId, nombre);
            notificacionService.procesarEmpleadoCreado(empleadoId, nombre, email);
            log.info("✅ Mensaje procesado exitosamente: {}", RabbitMQConfig.RK_CREADO);

        } catch (RuntimeException e) {
            log.error("❌ Error al procesar mensaje {}: {}", RabbitMQConfig.RK_CREADO, e.getMessage());
            throw new RuntimeException(e); // Spring AMQP reencola (nack + requeue)
        }
    }

    /**
     * Consume eventos: empleado.eliminado
     */
    @RabbitListener(queues = RabbitMQConfig.QUEUE_ELIMINADO)
    public void onEmpleadoEliminado(JsonNode json) {
        log.info("📨 Evento recibido: {} | payload: {}", RabbitMQConfig.RK_ELIMINADO, json);
        try {
            String empleadoId = json.path("empleadoId").asText();
            String nombre     = json.path("nombre").asText();
            String email      = json.path("email").asText();

            log.info("📧 Procesando notificación de desvinculación para: {} - {}", empleadoId, nombre);
            notificacionService.procesarEmpleadoDesvinculado(empleadoId, nombre, email, null);
            log.info("✅ Mensaje procesado exitosamente: {}", RabbitMQConfig.RK_ELIMINADO);

        } catch (RuntimeException e) {
            log.error("❌ Error al procesar mensaje {}: {}", RabbitMQConfig.RK_ELIMINADO, e.getMessage());
            throw new RuntimeException(e);
        }
    }

    /**
     * Consume eventos: empleado.reactivado
     */
    @RabbitListener(queues = RabbitMQConfig.QUEUE_REACTIVADO)
    public void onEmpleadoReactivado(JsonNode json) {
        log.info("📨 Evento recibido: {} | payload: {}", RabbitMQConfig.RK_REACTIVADO, json);
        try {
            String empleadoId = json.path("empleadoId").asText();
            String nombre     = json.path("nombre").asText();
            String email      = json.path("email").asText();

            notificacionService.procesarEmpleadoReactivado(empleadoId, nombre, email);
            log.info("✅ Mensaje procesado exitosamente: {}", RabbitMQConfig.RK_REACTIVADO);

        } catch (RuntimeException e) {
            log.error("❌ Error al procesar mensaje {}: {}", RabbitMQConfig.RK_REACTIVADO, e.getMessage());
            throw new RuntimeException(e);
        }
    }

    /**
     * Consume eventos: usuario.creado (activación de cuenta)
     */
    @RabbitListener(queues = RabbitMQConfig.QUEUE_USUARIO_CREADO)
    public void onUsuarioCreado(JsonNode json) {
        log.info("📨 Evento recibido: {} | payload: {}", RabbitMQConfig.RK_USUARIO_CREADO, json);
        try {
            String empleadoId = json.path("empleadoId").asText();
            String email      = json.path("email").asText();
            String token      = json.path("token").asText();
            String nombre     = json.has("nombre") ? json.path("nombre").asText() : null;

            log.info("📧 Procesando email de activación para: {}", empleadoId);
            notificacionService.procesarUsuarioCreado(empleadoId, email, token, nombre);
            log.info("✅ Mensaje procesado exitosamente: {}", RabbitMQConfig.RK_USUARIO_CREADO);

        } catch (RuntimeException e) {
            log.error("❌ Error al procesar mensaje {}: {}", RabbitMQConfig.RK_USUARIO_CREADO, e.getMessage());
            throw new RuntimeException(e);
        }
    }

    /**
     * Consume eventos: usuario.recuperacion (recuperación de contraseña)
     */
    @RabbitListener(queues = RabbitMQConfig.QUEUE_USUARIO_RECUP)
    public void onUsuarioRecuperacion(JsonNode json) {
        log.info("📨 Evento recibido: {} | payload: {}", RabbitMQConfig.RK_USUARIO_RECUP, json);
        try {
            String empleadoId = json.path("empleadoId").asText();
            String email      = json.path("email").asText();
            String token      = json.path("token").asText();

            log.info("📧 Procesando email de recuperación de contraseña para: {}", empleadoId);
            notificacionService.procesarUsuarioRecuperacion(empleadoId, email, token);
            log.info("✅ Mensaje procesado exitosamente: {}", RabbitMQConfig.RK_USUARIO_RECUP);

        } catch (RuntimeException e) {
            log.error("❌ Error al procesar mensaje {}: {}", RabbitMQConfig.RK_USUARIO_RECUP, e.getMessage());
            throw new RuntimeException(e);
        }
    }
}
