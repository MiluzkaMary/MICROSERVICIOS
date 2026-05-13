package com.empresa.notificaciones.service;

import com.empresa.notificaciones.dto.EstadisticasDto;
import com.empresa.notificaciones.dto.NotificacionDTO;
import com.empresa.notificaciones.dto.PaginatedResponse;
import com.empresa.notificaciones.model.Notificacion;
import com.empresa.notificaciones.model.Notificacion.EstadoNotificacion;
import com.empresa.notificaciones.model.Notificacion.TipoNotificacion;
import com.empresa.notificaciones.repository.NotificacionRepository;
import com.empresa.notificaciones.repository.NotificacionSpecification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificacionService {

    private static final Logger log = LoggerFactory.getLogger(NotificacionService.class);

    private final NotificacionRepository repository;
    private final EmailService emailService;

    public NotificacionService(NotificacionRepository repository, EmailService emailService) {
        this.repository = repository;
        this.emailService = emailService;
    }

    public PaginatedResponse<NotificacionDTO> obtenerConPaginacion(
            int page, int size, String sortBy, String order,
            String q, String tipo, String estado, String empleadoId, String destinatario) {

        Sort sort = order.equalsIgnoreCase("ASC")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        PageRequest pageable = PageRequest.of(page - 1, size, sort);
        Specification<Notificacion> spec = NotificacionSpecification.withFilters(
                q, tipo, estado, empleadoId, destinatario);

        Page<Notificacion> resultado = repository.findAll(spec, pageable);
        List<NotificacionDTO> items = resultado.getContent().stream()
                .map(NotificacionDTO::from).toList();

        PaginatedResponse<NotificacionDTO> response = new PaginatedResponse<>();
        response.setPage(page);
        response.setSize(size);
        response.setTotalRecords(resultado.getTotalElements());
        response.setTotalPages(resultado.getTotalPages());
        response.setItems(items);
        return response;
    }

    public List<NotificacionDTO> obtenerPorEmpleado(String empleadoId) {
        return repository.findByEmpleadoIdOrderByFechaEnvioDesc(empleadoId)
                .stream().map(NotificacionDTO::from).toList();
    }

    public EstadisticasDto obtenerEstadisticas() {
        Object[] raw = repository.getRawEstadisticas();
        EstadisticasDto dto = new EstadisticasDto();
        dto.setTotal(toLong(raw[0]));
        dto.setBienvenidas(toLong(raw[1]));
        dto.setDesvinculaciones(toLong(raw[2]));
        dto.setActivaciones(toLong(raw[3]));
        dto.setRecuperaciones(toLong(raw[4]));
        dto.setEnviadas(toLong(raw[5]));
        dto.setFallidas(toLong(raw[6]));
        dto.setPendientes(toLong(raw[7]));
        return dto;
    }

    @Transactional
    public NotificacionDTO procesarEmpleadoCreado(String empleadoId, String nombre, String email) {
        log.info("📬 Procesando bienvenida para {} ({})", nombre, empleadoId);
        Notificacion n = crearYGuardar(TipoNotificacion.BIENVENIDA, empleadoId, email,
                "¡Bienvenido a la empresa " + nombre + "! Tu ID es " + empleadoId + ".");
        boolean enviado = emailService.enviarBienvenida(nombre, email, empleadoId);
        return actualizarEstado(n, enviado);
    }

    @Transactional
    public NotificacionDTO procesarEmpleadoDesvinculado(String empleadoId, String nombre, String email, String motivo) {
        log.info("📬 Procesando desvinculación para {} ({})", nombre, empleadoId);
        String msg = "Estimado/a " + nombre + ", tu relación laboral ha finalizado."
                + (motivo != null && !motivo.isBlank() ? " Motivo: " + motivo : "");
        Notificacion n = crearYGuardar(TipoNotificacion.DESVINCULACION, empleadoId, email, msg);
        boolean enviado = emailService.enviarDesvinculacion(nombre, email, empleadoId, motivo);
        return actualizarEstado(n, enviado);
    }

    @Transactional
    public NotificacionDTO procesarEmpleadoReactivado(String empleadoId, String nombre, String email) {
        log.info("📬 Procesando reactivación para {} ({})", nombre, empleadoId);
        Notificacion n = crearYGuardar(TipoNotificacion.ACTIVACION, empleadoId, email,
                "Reactivación de cuenta para " + empleadoId);
        boolean enviado = emailService.enviarVinculacion(nombre, email, empleadoId);
        return actualizarEstado(n, enviado);
    }

    @Transactional
    public NotificacionDTO procesarUsuarioCreado(String empleadoId, String email, String token, String nombre) {
        log.info("📬 Procesando activación para {}", empleadoId);
        Notificacion n = crearYGuardar(TipoNotificacion.ACTIVACION, empleadoId, email,
                "Token de activación generado para " + empleadoId);
        boolean enviado = emailService.enviarActivacion(nombre, email, empleadoId, token);
        return actualizarEstado(n, enviado);
    }

    @Transactional
    public NotificacionDTO procesarUsuarioRecuperacion(String empleadoId, String email, String token) {
        log.info("📬 Procesando recuperación de contraseña para {}", empleadoId);
        Notificacion n = crearYGuardar(TipoNotificacion.RECUPERACION, empleadoId, email,
                "Token de recuperación generado para " + empleadoId);
        boolean enviado = emailService.enviarRecuperacion(email, empleadoId, token);
        return actualizarEstado(n, enviado);
    }

    // --- helpers ---

    private Notificacion crearYGuardar(TipoNotificacion tipo, String empleadoId, String email, String mensaje) {
        Notificacion n = new Notificacion();
        n.setTipo(tipo);
        n.setEmpleadoId(empleadoId);
        n.setDestinatario(email);
        n.setMensaje(mensaje);
        n.setEstado(EstadoNotificacion.PENDIENTE);
        return repository.save(n);
    }

    private NotificacionDTO actualizarEstado(Notificacion n, boolean enviado) {
        n.setEstado(enviado ? EstadoNotificacion.ENVIADA : EstadoNotificacion.FALLIDA);
        return NotificacionDTO.from(repository.save(n));
    }

    private long toLong(Object val) {
        if (val == null) return 0L;
        if (val instanceof Number number) return number.longValue();
        return Long.parseLong(val.toString());
    }
}
