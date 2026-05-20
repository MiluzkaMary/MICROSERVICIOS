package com.empresa.notificaciones.messaging;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import org.mockito.junit.jupiter.MockitoExtension;

import com.empresa.notificaciones.service.NotificacionService;
import com.fasterxml.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class NotificacionEventConsumerTest {

    @Mock
    private NotificacionService service;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void shouldConsumeEmpleadoCreadoAndCallService() throws Exception {
        NotificacionEventConsumer consumer = new NotificacionEventConsumer(service);
        consumer.onEmpleadoCreado(objectMapper.readTree("{\"empleadoId\":\"E001\",\"nombre\":\"Juan\",\"email\":\"juan@empresa.com\"}"));

        verify(service).procesarEmpleadoCreado("E001", "Juan", "juan@empresa.com");
    }

    @Test
    void shouldConsumeUsuarioRecuperacionAndCallService() throws Exception {
        NotificacionEventConsumer consumer = new NotificacionEventConsumer(service);
        consumer.onUsuarioRecuperacion(objectMapper.readTree("{\"empleadoId\":\"E001\",\"email\":\"juan@empresa.com\",\"token\":\"abc\"}"));

        verify(service).procesarUsuarioRecuperacion("E001", "juan@empresa.com", "abc");
    }
}