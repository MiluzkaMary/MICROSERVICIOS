package com.empresa.notificaciones.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.empresa.notificaciones.model.Notificacion;

public class NotificacionDTO {
    private Long id;
    private String tipo;
    private String destinatario;
    private String mensaje;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaEnvio;
    private String empleadoId;
    private String estado;

    public NotificacionDTO() {
    }

    public static NotificacionDTO from(Notificacion n) {
        NotificacionDTO dto = new NotificacionDTO();
        dto.setId(n.getId());
        dto.setTipo(n.getTipo() != null ? n.getTipo().name() : null);
        dto.setDestinatario(n.getDestinatario());
        dto.setMensaje(n.getMensaje());
        dto.setFechaEnvio(n.getFechaEnvio());
        dto.setEmpleadoId(n.getEmpleadoId());
        dto.setEstado(n.getEstado() != null ? n.getEstado().name() : null);
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getDestinatario() {
        return destinatario;
    }

    public void setDestinatario(String destinatario) {
        this.destinatario = destinatario;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }

    public LocalDateTime getFechaEnvio() {
        return fechaEnvio;
    }

    public void setFechaEnvio(LocalDateTime fechaEnvio) {
        this.fechaEnvio = fechaEnvio;
    }

    public String getEmpleadoId() {
        return empleadoId;
    }

    public void setEmpleadoId(String empleadoId) {
        this.empleadoId = empleadoId;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}