-- Tabla de empleados 

CREATE TABLE IF NOT EXISTS empleados (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    numero_empleado VARCHAR(50) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_empleados_email ON empleados(email);
CREATE INDEX IF NOT EXISTS idx_empleados_numero_empleado ON empleados(numero_empleado);
CREATE INDEX IF NOT EXISTS idx_empleados_estado ON empleados(estado);
