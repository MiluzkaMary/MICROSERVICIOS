package com.empresa.notificaciones.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.empresa.notificaciones.config.RabbitMQConfig;
import com.empresa.notificaciones.service.NotificacionService;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * Consumidor de eventos RabbitMQ para el Servicio de Notificaciones.
 * Equivalente a los channel.consume() en src/config/rabbitmq.js.
 */
@Component
public class NotificacionEventConsumer {

    private static final String FIELD_EMPLEADO_ID = "empleadoId";
    private static final String FIELD_NOMBRE = "nombre";
    private static final String FIELD_EMAIL = "email";
    private static final String FIELD_TOKEN = "token";
    private static final String LOG_EVENT_RECEIVED = "📨 Evento recibido: {} | payload: {}";
    private static final String LOG_EVENT_SUCCESS = "✅ Mensaje procesado exitosamente: {}";
    private static final String LOG_EVENT_ERROR = "❌ Error al procesar mensaje {}: {}";

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
        log.info(LOG_EVENT_RECEIVED, RabbitMQConfig.RK_CREADO, json);
        try {
            String empleadoId = leerCampo(json, FIELD_EMPLEADO_ID);
            String nombre = leerCampo(json, FIELD_NOMBRE);
            String email = leerCampo(json, FIELD_EMAIL);

            log.info("📧 Procesando notificación de bienvenida para: {} - {}", empleadoId, nombre);
            notificacionService.procesarEmpleadoCreado(empleadoId, nombre, email);
            log.info(LOG_EVENT_SUCCESS, RabbitMQConfig.RK_CREADO);

        } catch (RuntimeException e) {
            log.error(LOG_EVENT_ERROR, RabbitMQConfig.RK_CREADO, e.getMessage());
            throw new NotificacionEventProcessingException(RabbitMQConfig.RK_CREADO, e);
        }
    }

    /**
     * Consume eventos: empleado.eliminado
     */
    @RabbitListener(queues = RabbitMQConfig.QUEUE_ELIMINADO)
    public void onEmpleadoEliminado(JsonNode json) {
        log.info(LOG_EVENT_RECEIVED, RabbitMQConfig.RK_ELIMINADO, json);
        try {
            String empleadoId = leerCampo(json, FIELD_EMPLEADO_ID);
            String nombre = leerCampo(json, FIELD_NOMBRE);
            String email = leerCampo(json, FIELD_EMAIL);

            log.info("📧 Procesando notificación de desvinculación para: {} - {}", empleadoId, nombre);
            notificacionService.procesarEmpleadoDesvinculado(empleadoId, nombre, email, null);
            log.info(LOG_EVENT_SUCCESS, RabbitMQConfig.RK_ELIMINADO);

        } catch (RuntimeException e) {
            log.error(LOG_EVENT_ERROR, RabbitMQConfig.RK_ELIMINADO, e.getMessage());
            throw new NotificacionEventProcessingException(RabbitMQConfig.RK_ELIMINADO, e);
        }
    }

    /**
     * Consume eventos: empleado.reactivado
     */
    @RabbitListener(queues = RabbitMQConfig.QUEUE_REACTIVADO)
    public void onEmpleadoReactivado(JsonNode json) {
        log.info(LOG_EVENT_RECEIVED, RabbitMQConfig.RK_REACTIVADO, json);
        try {
            String empleadoId = leerCampo(json, FIELD_EMPLEADO_ID);
            String nombre = leerCampo(json, FIELD_NOMBRE);
            String email = leerCampo(json, FIELD_EMAIL);

            notificacionService.procesarEmpleadoReactivado(empleadoId, nombre, email);
            log.info(LOG_EVENT_SUCCESS, RabbitMQConfig.RK_REACTIVADO);

        } catch (RuntimeException e) {
            log.error(LOG_EVENT_ERROR, RabbitMQConfig.RK_REACTIVADO, e.getMessage());
            throw new NotificacionEventProcessingException(RabbitMQConfig.RK_REACTIVADO, e);
        }
    }

    /**
     * Consume eventos: usuario.creado (activación de cuenta)
     */
    @RabbitListener(queues = RabbitMQConfig.QUEUE_USUARIO_CREADO)
    public void onUsuarioCreado(JsonNode json) {
        log.info(LOG_EVENT_RECEIVED, RabbitMQConfig.RK_USUARIO_CREADO, json);
        try {
            String empleadoId = leerCampo(json, FIELD_EMPLEADO_ID);
            String email = leerCampo(json, FIELD_EMAIL);
            String token = leerCampo(json, FIELD_TOKEN);
            String nombre = leerCampoOpcional(json, FIELD_NOMBRE);

            log.info("📧 Procesando email de activación para: {}", empleadoId);
            notificacionService.procesarUsuarioCreado(empleadoId, email, token, nombre);
            log.info(LOG_EVENT_SUCCESS, RabbitMQConfig.RK_USUARIO_CREADO);

        } catch (RuntimeException e) {
            log.error(LOG_EVENT_ERROR, RabbitMQConfig.RK_USUARIO_CREADO, e.getMessage());
            throw new NotificacionEventProcessingException(RabbitMQConfig.RK_USUARIO_CREADO, e);
        }
    }

    /**
     * Consume eventos: usuario.recuperacion (recuperación de contraseña)
     */
    @RabbitListener(queues = RabbitMQConfig.QUEUE_USUARIO_RECUP)
    public void onUsuarioRecuperacion(JsonNode json) {
        log.info(LOG_EVENT_RECEIVED, RabbitMQConfig.RK_USUARIO_RECUP, json);
        try {
            String empleadoId = leerCampo(json, FIELD_EMPLEADO_ID);
            String email = leerCampo(json, FIELD_EMAIL);
            String token = leerCampo(json, FIELD_TOKEN);

            log.info("📧 Procesando email de recuperación de contraseña para: {}", empleadoId);
            notificacionService.procesarUsuarioRecuperacion(empleadoId, email, token);
            log.info(LOG_EVENT_SUCCESS, RabbitMQConfig.RK_USUARIO_RECUP);

        } catch (RuntimeException e) {
            log.error(LOG_EVENT_ERROR, RabbitMQConfig.RK_USUARIO_RECUP, e.getMessage());
            throw new NotificacionEventProcessingException(RabbitMQConfig.RK_USUARIO_RECUP, e);
        }
    }

    private String leerCampo(JsonNode json, String fieldName) {
        return json.path(fieldName).asText();
    }

    private String leerCampoOpcional(JsonNode json, String fieldName) {
        return json.has(fieldName) ? json.path(fieldName).asText() : null;
    }
}
