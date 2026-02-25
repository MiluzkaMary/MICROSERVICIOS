-- Tabla de historial de notificaciones

CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('BIENVENIDA', 'DESVINCULACION')),
    destinatario VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    empleado_id VARCHAR(50) NOT NULL,
    estado VARCHAR(20) DEFAULT 'ENVIADA' CHECK (estado IN ('ENVIADA', 'FALLIDA', 'PENDIENTE'))
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_notificaciones_empleado_id ON notificaciones(empleado_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON notificaciones(tipo);
CREATE INDEX IF NOT EXISTS idx_notificaciones_fecha_envio ON notificaciones(fecha_envio DESC);
CREATE INDEX IF NOT EXISTS idx_notificaciones_estado ON notificaciones(estado);

-- Comentarios
COMMENT ON TABLE notificaciones IS 'Historial de notificaciones enviadas a empleados';
COMMENT ON COLUMN notificaciones.tipo IS 'Tipo de notificación: BIENVENIDA o DESVINCULACION';
COMMENT ON COLUMN notificaciones.destinatario IS 'Email del destinatario';
COMMENT ON COLUMN notificaciones.mensaje IS 'Contenido del mensaje enviado';
COMMENT ON COLUMN notificaciones.fecha_envio IS 'Fecha y hora de envío de la notificación';
COMMENT ON COLUMN notificaciones.empleado_id IS 'ID del empleado relacionado';
COMMENT ON COLUMN notificaciones.estado IS 'Estado del envío: ENVIADA, FALLIDA, PENDIENTE';
