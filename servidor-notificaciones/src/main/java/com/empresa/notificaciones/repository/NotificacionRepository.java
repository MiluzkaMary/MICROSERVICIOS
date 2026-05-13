package com.empresa.notificaciones.repository;

import com.empresa.notificaciones.model.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificacionRepository
        extends JpaRepository<Notificacion, Long>, JpaSpecificationExecutor<Notificacion> {

    List<Notificacion> findByEmpleadoIdOrderByFechaEnvioDesc(String empleadoId);

    @Query(value = """
        SELECT
            COUNT(*),
            SUM(CASE WHEN tipo = 'BIENVENIDA' THEN 1 ELSE 0 END),
            SUM(CASE WHEN tipo = 'DESVINCULACION' THEN 1 ELSE 0 END),
            SUM(CASE WHEN tipo = 'ACTIVACION' THEN 1 ELSE 0 END),
            SUM(CASE WHEN tipo = 'RECUPERACION' THEN 1 ELSE 0 END),
            SUM(CASE WHEN estado = 'ENVIADA' THEN 1 ELSE 0 END),
            SUM(CASE WHEN estado = 'FALLIDA' THEN 1 ELSE 0 END),
            SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END)
        FROM notificaciones
        """, nativeQuery = true)
    Object[] getRawEstadisticas();
}
