-- Tabla de historial de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('BIENVENIDA', 'DESVINCULACION', 'ACTIVACION', 'RECUPERACION')),
    destinatario VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    empleado_id VARCHAR(50) NOT NULL,
    estado VARCHAR(20) DEFAULT 'ENVIADA' CHECK (estado IN ('ENVIADA', 'FALLIDA', 'PENDIENTE'))
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_empleado_id ON notificaciones(empleado_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON notificaciones(tipo);
CREATE INDEX IF NOT EXISTS idx_notificaciones_fecha_envio ON notificaciones(fecha_envio DESC);
CREATE INDEX IF NOT EXISTS idx_notificaciones_estado ON notificaciones(estado);
