# Servidor Empleados

Microservicio para gestion de empleados con Node.js, Express y PostgreSQL.

## Estructura

```
servidor-empleados/
 src/
    controllers/    # Manejo de HTTP
    services/       # Logica de negocio
    repositories/   # Acceso a BD
    models/         # Modelos
    validators/     # Validaciones
    routes/         # Endpoints
    config/         # Configuracion BD
 docker-compose.yml  # Orquestacion
 Dockerfile          # Imagen app
 init.sql           # Script BD
```

## Uso

Ver comandos en [COMANDOS.md](COMANDOS.md)

## Endpoints

- `POST /empleados` - Crear empleado
- `GET /empleados/:id` - Obtener empleado
- `GET /empleados` - Listar todos
- `GET /health` - Health check

## Base de Datos

PostgreSQL con tabla empleados (id, nombre, apellido, email, numero_empleado, cargo, area, estado)
