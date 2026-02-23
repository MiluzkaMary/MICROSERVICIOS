-- Tabla de departamentos

CREATE TABLE IF NOT EXISTS departamentos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_departamentos_nombre ON departamentos(nombre);

-- Insertar departamentos de ejemplo para pruebas
INSERT INTO departamentos (nombre, descripcion) VALUES
    ('Tecnología', 'Departamento de desarrollo de software e infraestructura'),
    ('Recursos Humanos', 'Gestión de personal y nómina'),
    ('Ventas', 'Equipo comercial y relaciones con clientes'),
    ('Marketing', 'Estrategia de marca y comunicación'),
    ('Finanzas', 'Contabilidad y control financiero')
ON CONFLICT (nombre) DO NOTHING;
