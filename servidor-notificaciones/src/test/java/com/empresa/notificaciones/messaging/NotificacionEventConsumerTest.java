package com.empresa.notificaciones.messaging;

import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
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
    void shouldConsumeEmpleadoCreadoAndAcceptNumericEmployeeId() throws Exception {
        NotificacionEventConsumer consumer = new NotificacionEventConsumer(service);
        consumer.onEmpleadoCreado(objectMapper.readTree("{\"empleadoId\":1001,\"nombre\":\"Juan\",\"email\":\"juan@empresa.com\"}"));

        verify(service).procesarEmpleadoCreado("1001", "Juan", "juan@empresa.com");
    }

    @Test
    void shouldRethrowWhenEmpleadoCreadoProcessingFails() throws Exception {
        NotificacionEventConsumer consumer = new NotificacionEventConsumer(service);
        when(service.procesarEmpleadoCreado("E001", "Juan", "juan@empresa.com"))
                .thenThrow(new IllegalStateException("boom"));

        assertThrows(RuntimeException.class, () ->
                consumer.onEmpleadoCreado(objectMapper.readTree("{\"empleadoId\":\"E001\",\"nombre\":\"Juan\",\"email\":\"juan@empresa.com\"}")));
    }

    @Test
    void shouldConsumeEmpleadoEliminadoAndCallService() throws Exception {
        NotificacionEventConsumer consumer = new NotificacionEventConsumer(service);
        consumer.onEmpleadoEliminado(objectMapper.readTree("{\"empleadoId\":\"E001\",\"nombre\":\"Juan\",\"email\":\"juan@empresa.com\"}"));

        verify(service).procesarEmpleadoDesvinculado("E001", "Juan", "juan@empresa.com", null);
    }

    @Test
    void shouldConsumeEmpleadoReactivadoAndCallService() throws Exception {
        NotificacionEventConsumer consumer = new NotificacionEventConsumer(service);
        consumer.onEmpleadoReactivado(objectMapper.readTree("{\"empleadoId\":\"E001\",\"nombre\":\"Juan\",\"email\":\"juan@empresa.com\"}"));

        verify(service).procesarEmpleadoReactivado("E001", "Juan", "juan@empresa.com");
    }

    @Test
    void shouldConsumeUsuarioCreadoWithoutNombreAndCallServiceWithNullName() throws Exception {
        NotificacionEventConsumer consumer = new NotificacionEventConsumer(service);
        consumer.onUsuarioCreado(objectMapper.readTree("{\"empleadoId\":\"E001\",\"email\":\"juan@empresa.com\",\"token\":\"abc\"}"));

        verify(service).procesarUsuarioCreado("E001", "juan@empresa.com", "abc", null);
    }

    @Test
    void shouldConsumeUsuarioCreadoWithNombreAndCallService() throws Exception {
        NotificacionEventConsumer consumer = new NotificacionEventConsumer(service);
        consumer.onUsuarioCreado(objectMapper.readTree("{\"empleadoId\":\"E001\",\"email\":\"juan@empresa.com\",\"token\":\"abc\",\"nombre\":\"Juan\"}"));

        verify(service).procesarUsuarioCreado("E001", "juan@empresa.com", "abc", "Juan");
    }

    @Test
    void shouldConsumeUsuarioRecuperacionAndCallService() throws Exception {
        NotificacionEventConsumer consumer = new NotificacionEventConsumer(service);
        consumer.onUsuarioRecuperacion(objectMapper.readTree("{\"empleadoId\":\"E001\",\"email\":\"juan@empresa.com\",\"token\":\"abc\"}"));

        verify(service).procesarUsuarioRecuperacion("E001", "juan@empresa.com", "abc");
    }
}