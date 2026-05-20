package com.empresa.notificaciones.repository;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.empresa.notificaciones.model.Notificacion;
import com.empresa.notificaciones.model.Notificacion.EstadoNotificacion;
import com.empresa.notificaciones.model.Notificacion.TipoNotificacion;

@DataJpaTest
class NotificacionSpecificationTest {

    @Autowired
    private NotificacionRepository repository;

    @Test
    void withFiltersShouldMatchMultipleCriteriaAgainstDatabase() {
        repository.saveAll(List.of(
                notificacion(null, TipoNotificacion.BIENVENIDA, "juan@empresa.com", "Bienvenido Juan", "E001", EstadoNotificacion.ENVIADA, LocalDateTime.of(2026, 1, 1, 10, 0)),
                notificacion(null, TipoNotificacion.DESVINCULACION, "ana@empresa.com", "Desvinculación", "E002", EstadoNotificacion.FALLIDA, LocalDateTime.of(2026, 1, 2, 10, 0)),
                notificacion(null, TipoNotificacion.RECUPERACION, "otro@empresa.com", "Recuperación", "E003", EstadoNotificacion.PENDIENTE, LocalDateTime.of(2026, 1, 3, 10, 0))
        ));

        List<Notificacion> result = repository.findAll(NotificacionSpecification.withFilters(
                "juan",
                "bienvenida",
                "enviada",
                "E001",
                "empresa.com"));

        assertEquals(1, result.size());
        assertEquals("E001", result.get(0).getEmpleadoId());
        assertEquals(TipoNotificacion.BIENVENIDA, result.get(0).getTipo());
        assertEquals(EstadoNotificacion.ENVIADA, result.get(0).getEstado());
    }

    @Test
    void withInvalidFiltersShouldIgnoreInvalidEnumsAndReturnAllMatchingRecords() {
        repository.saveAll(List.of(
                notificacion(null, TipoNotificacion.BIENVENIDA, "juan@empresa.com", "Bienvenido Juan", "E001", EstadoNotificacion.ENVIADA, LocalDateTime.of(2026, 1, 1, 10, 0)),
                notificacion(null, TipoNotificacion.DESVINCULACION, "ana@empresa.com", "Desvinculación", "E002", EstadoNotificacion.FALLIDA, LocalDateTime.of(2026, 1, 2, 10, 0))
        ));

        List<Notificacion> result = repository.findAll(NotificacionSpecification.withFilters(
                null,
                "tipo-invalido",
                "estado-invalido",
                null,
                null));

        assertEquals(2, result.size());
    }

    @Test
    void findByEmpleadoIdShouldReturnNewestFirst() {
        repository.saveAll(List.of(
                notificacion(null, TipoNotificacion.BIENVENIDA, "juan@empresa.com", "Una", "E001", EstadoNotificacion.ENVIADA, LocalDateTime.of(2026, 1, 1, 10, 0)),
                notificacion(null, TipoNotificacion.RECUPERACION, "juan@empresa.com", "Dos", "E001", EstadoNotificacion.ENVIADA, LocalDateTime.of(2026, 1, 2, 10, 0))
        ));

        List<Notificacion> result = repository.findByEmpleadoIdOrderByFechaEnvioDesc("E001");

        assertEquals(2, result.size());
        assertEquals("Dos", result.get(0).getMensaje());
        assertEquals("Una", result.get(1).getMensaje());
    }

    @Test
    void getRawEstadisticasShouldAggregateCounts() {
        repository.saveAll(List.of(
                notificacion(null, TipoNotificacion.BIENVENIDA, "juan@empresa.com", "Una", "E001", EstadoNotificacion.ENVIADA, LocalDateTime.of(2026, 1, 1, 10, 0)),
                notificacion(null, TipoNotificacion.DESVINCULACION, "ana@empresa.com", "Dos", "E002", EstadoNotificacion.FALLIDA, LocalDateTime.of(2026, 1, 2, 10, 0)),
                notificacion(null, TipoNotificacion.ACTIVACION, "maria@empresa.com", "Tres", "E003", EstadoNotificacion.PENDIENTE, LocalDateTime.of(2026, 1, 3, 10, 0)),
                notificacion(null, TipoNotificacion.RECUPERACION, "luis@empresa.com", "Cuatro", "E004", EstadoNotificacion.ENVIADA, LocalDateTime.of(2026, 1, 4, 10, 0))
        ));

        Object[] stats = repository.getRawEstadisticas();

                Object[] row = (Object[]) stats[0];
                assertEquals(4L, row[0]);
                assertEquals(1L, row[1]);
                assertEquals(1L, row[2]);
                assertEquals(1L, row[3]);
                assertEquals(1L, row[4]);
                assertEquals(2L, row[5]);
                assertEquals(1L, row[6]);
                assertEquals(1L, row[7]);
    }

    private static Notificacion notificacion(Long id,
                                             TipoNotificacion tipo,
                                             String destinatario,
                                             String mensaje,
                                             String empleadoId,
                                             EstadoNotificacion estado,
                                             LocalDateTime fechaEnvio) {
        Notificacion notificacion = new Notificacion();
        notificacion.setId(id);
        notificacion.setTipo(tipo);
        notificacion.setDestinatario(destinatario);
        notificacion.setMensaje(mensaje);
        notificacion.setEmpleadoId(empleadoId);
        notificacion.setEstado(estado);
        notificacion.setFechaEnvio(fechaEnvio);
        return notificacion;
    }
}