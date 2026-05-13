package com.empresa.notificaciones.controller;

import com.empresa.notificaciones.dto.*;
import com.empresa.notificaciones.service.NotificacionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notificaciones")
@Tag(name = "Notificaciones", description = "Gestión de notificaciones por email")
public class NotificacionController {

    private final NotificacionService service;

        public NotificacionController(NotificacionService service) {
                this.service = service;
        }

    @GetMapping
    @Operation(summary = "Listar notificaciones con paginación y filtros",
               security = @SecurityRequirement(name = "BearerAuth"))
    public ResponseEntity<ApiResponse<PaginatedResponse<NotificacionDTO>>> listar(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "fechaEnvio") String sortBy,
            @RequestParam(defaultValue = "DESC") String order,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String empleadoId,
            @RequestParam(required = false) String destinatario) {

        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 100);
        PaginatedResponse<NotificacionDTO> data = service.obtenerConPaginacion(
                safePage, safeSize, sortBy, order, q, tipo, estado, empleadoId, destinatario);
        return ResponseEntity.ok(ApiResponse.success(data, 200));
    }

    @GetMapping("/estadisticas/resumen")
    @Operation(summary = "Obtener estadísticas generales",
               security = @SecurityRequirement(name = "BearerAuth"))
    public ResponseEntity<ApiResponse<EstadisticasDto>> estadisticas() {
        return ResponseEntity.ok(ApiResponse.success(service.obtenerEstadisticas(), 200));
    }

    @GetMapping("/{empleadoId}")
    @Operation(summary = "Listar notificaciones de un empleado",
               security = @SecurityRequirement(name = "BearerAuth"))
    public ResponseEntity<ApiResponse<List<NotificacionDTO>>> porEmpleado(
            @PathVariable String empleadoId) {
        List<NotificacionDTO> lista = service.obtenerPorEmpleado(empleadoId);
        return ResponseEntity.ok(ApiResponse.success(lista, 200, lista.size()));
    }

    @PostMapping("/evento/empleado-creado")
    @Operation(summary = "Procesar evento de empleado creado")
    public ResponseEntity<ApiResponse<NotificacionDTO>> empleadoCreado(
            @Valid @RequestBody EventoEmpleadoCreadoRequest dto) {
        NotificacionDTO result = service.procesarEmpleadoCreado(
                dto.getEmpleadoId(), dto.getNombre(), dto.getEmail());
        return ResponseEntity.status(201)
                .body(ApiResponse.success(result, 201, "Notificación de bienvenida procesada"));
    }

    @PostMapping("/evento/empleado-desvinculado")
    @Operation(summary = "Procesar evento de empleado desvinculado")
    public ResponseEntity<ApiResponse<NotificacionDTO>> empleadoDesvinculado(
            @Valid @RequestBody EventoEmpleadoDesvinculadoRequest dto) {
        NotificacionDTO result = service.procesarEmpleadoDesvinculado(
                dto.getEmpleadoId(), dto.getNombre(), dto.getEmail(), dto.getMotivo());
        return ResponseEntity.status(201)
                .body(ApiResponse.success(result, 201, "Notificación de desvinculación procesada"));
    }
}
