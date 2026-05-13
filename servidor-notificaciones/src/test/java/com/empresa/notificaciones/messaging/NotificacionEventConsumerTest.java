package com.empresa.notificaciones.messaging;

import com.empresa.notificaciones.service.NotificacionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class NotificacionEventConsumerTest {

    @Mock
    private NotificacionService service;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void shouldConsumeEmpleadoCreadoAndCallService() throws Exception {
        NotificacionEventConsumer consumer = new NotificacionEventConsumer(service, objectMapper);
        consumer.onEmpleadoCreado("{\"empleadoId\":\"E001\",\"nombre\":\"Juan\",\"email\":\"juan@empresa.com\"}");

        verify(service).procesarEmpleadoCreado("E001", "Juan", "juan@empresa.com");
    }

    @Test
    void shouldConsumeUsuarioRecuperacionAndCallService() throws Exception {
        NotificacionEventConsumer consumer = new NotificacionEventConsumer(service, objectMapper);
        consumer.onUsuarioRecuperacion("{\"empleadoId\":\"E001\",\"email\":\"juan@empresa.com\",\"token\":\"abc\"}");

        verify(service).procesarUsuarioRecuperacion("E001", "juan@empresa.com", "abc");
    }
}