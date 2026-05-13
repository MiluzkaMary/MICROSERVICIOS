package com.empresa.notificaciones.dto;

/**
 * DTO de estadísticas generales de notificaciones
 */
public class EstadisticasDto {
    private long total;
    private long bienvenidas;
    private long desvinculaciones;
    private long activaciones;
    private long recuperaciones;
    private long enviadas;
    private long fallidas;
    private long pendientes;

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public long getBienvenidas() {
        return bienvenidas;
    }

    public void setBienvenidas(long bienvenidas) {
        this.bienvenidas = bienvenidas;
    }

    public long getDesvinculaciones() {
        return desvinculaciones;
    }

    public void setDesvinculaciones(long desvinculaciones) {
        this.desvinculaciones = desvinculaciones;
    }

    public long getActivaciones() {
        return activaciones;
    }

    public void setActivaciones(long activaciones) {
        this.activaciones = activaciones;
    }

    public long getRecuperaciones() {
        return recuperaciones;
    }

    public void setRecuperaciones(long recuperaciones) {
        this.recuperaciones = recuperaciones;
    }

    public long getEnviadas() {
        return enviadas;
    }

    public void setEnviadas(long enviadas) {
        this.enviadas = enviadas;
    }

    public long getFallidas() {
        return fallidas;
    }

    public void setFallidas(long fallidas) {
        this.fallidas = fallidas;
    }

    public long getPendientes() {
        return pendientes;
    }

    public void setPendientes(long pendientes) {
        this.pendientes = pendientes;
    }
}
