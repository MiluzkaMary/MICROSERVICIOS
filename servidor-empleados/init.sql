-- Tabla de empleados 

CREATE TABLE IF NOT EXISTS empleados (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    departamento_id VARCHAR(50) NOT NULL,
    fecha_ingreso DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_empleados_email ON empleados(email);
CREATE INDEX IF NOT EXISTS idx_empleados_departamento_id ON empleados(departamento_id);
