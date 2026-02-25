-- Tabla de perfiles de empleados

CREATE TABLE IF NOT EXISTS perfiles (
    id SERIAL PRIMARY KEY,
    empleado_id VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(20) DEFAULT '',
    direccion VARCHAR(255) DEFAULT '',
    ciudad VARCHAR(100) DEFAULT '',
    biografia TEXT DEFAULT '',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_perfiles_empleado_id ON perfiles(empleado_id);
CREATE INDEX IF NOT EXISTS idx_perfiles_email ON perfiles(email);

-- Trigger para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION update_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_fecha_actualizacion
BEFORE UPDATE ON perfiles
FOR EACH ROW
EXECUTE FUNCTION update_fecha_actualizacion();
