package com.empresa.notificaciones.messaging;

public class NotificacionEventProcessingException extends RuntimeException {

    public NotificacionEventProcessingException(String routingKey, Throwable cause) {
        super("Error al procesar mensaje " + routingKey, cause);
    }
}