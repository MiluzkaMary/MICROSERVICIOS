package com.empresa.notificaciones.service;

import com.empresa.notificaciones.dto.EstadisticasDto;
import com.empresa.notificaciones.dto.NotificacionDTO;
import com.empresa.notificaciones.model.Notificacion;
import com.empresa.notificaciones.repository.NotificacionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificacionServiceTest {

    @Mock
    private NotificacionRepository repository;

    @Mock
    private EmailService emailService;

    @Test
    void procesarEmpleadoCreadoShouldPersistAndMarkSentWhenEmailSucceeds() {
        Notificacion guardada = new Notificacion();
        guardada.setId(1L);
        guardada.setTipo(Notificacion.TipoNotificacion.BIENVENIDA);
        guardada.setEmpleadoId("E001");
        guardada.setDestinatario("juan@empresa.com");
        guardada.setMensaje("mensaje");
        guardada.setEstado(Notificacion.EstadoNotificacion.PENDIENTE);
        guardada.setFechaEnvio(LocalDateTime.now());

        Notificacion enviada = new Notificacion();
        enviada.setId(1L);
        enviada.setTipo(Notificacion.TipoNotificacion.BIENVENIDA);
        enviada.setEmpleadoId("E001");
        enviada.setDestinatario("juan@empresa.com");
        enviada.setMensaje("mensaje");
        enviada.setEstado(Notificacion.EstadoNotificacion.ENVIADA);
        enviada.setFechaEnvio(LocalDateTime.now());

        when(repository.save(any(Notificacion.class))).thenReturn(guardada).thenReturn(enviada);
        when(emailService.enviarBienvenida("Juan", "juan@empresa.com", "E001")).thenReturn(true);

        NotificacionService service = new NotificacionService(repository, emailService);
        NotificacionDTO result = service.procesarEmpleadoCreado("E001", "Juan", "juan@empresa.com");

        assertEquals("ENVIADA", result.getEstado());
        verify(repository, times(2)).save(any(Notificacion.class));
        verify(emailService).enviarBienvenida("Juan", "juan@empresa.com", "E001");
    }

    @Test
    void obtenerEstadisticasShouldMapRepositoryValues() {
        when(repository.getRawEstadisticas()).thenReturn(new Object[]{10L, 4L, 2L, 3L, 1L, 9L, 1L, 0L});

        NotificacionService service = new NotificacionService(repository, emailService);
        EstadisticasDto dto = service.obtenerEstadisticas();

        assertEquals(10L, dto.getTotal());
        assertEquals(4L, dto.getBienvenidas());
        assertEquals(2L, dto.getDesvinculaciones());
        assertEquals(3L, dto.getActivaciones());
        assertEquals(1L, dto.getRecuperaciones());
        assertEquals(9L, dto.getEnviadas());
        assertEquals(1L, dto.getFallidas());
        assertEquals(0L, dto.getPendientes());
    }
}