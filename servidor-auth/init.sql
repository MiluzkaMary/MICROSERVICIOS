-- Tabla de usuarios para autenticación
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    empleado_id VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),  -- NULL cuando aún no ha establecido contraseña
    role VARCHAR(20) NOT NULL DEFAULT 'USER', -- ADMIN o USER
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_empleado_id ON usuarios(empleado_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_fecha_modificacion
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_modificacion();

-- ==========================================
-- USUARIO ADMIN INICIAL (DESARROLLO LOCAL)
-- ==========================================
-- ADVERTENCIA DE SEGURIDAD:
-- Este usuario admin es SOLO para desarrollo local y pruebas.
-- 
-- EN PRODUCCIÓN:
-- 1. Cambiar contraseña INMEDIATAMENTE después del primer deploy
-- 2. O eliminar este INSERT y crear admin manualmente con contraseña segura
-- 
-- Contraseña temporal de desarrollo: admin123
-- ==========================================

INSERT INTO usuarios (empleado_id, email, password_hash, role, activo) 
VALUES ('ADMIN', 'admin@empresa.com', '$2a$10$yAq5GaLIVBZmpZKAaxRz9.TfeEwy1h3PKRwwbXEU.kF3sSdbiCqkG', 'ADMIN', true)
ON CONFLICT (empleado_id) DO NOTHING;
