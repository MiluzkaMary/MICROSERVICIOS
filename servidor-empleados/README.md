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

### `POST /empleados`
Crear un nuevo empleado

### `GET /empleados/:id`
Obtener un empleado por ID

### `GET /empleados`
Listar empleados con soporte para paginación y filtrado

**Query Parameters (opcionales):**
- `page` - Número de página (default: 1, mínimo: 1)
- `size` - Registros por página (default: 10, mínimo: 1, máximo: 100)
- `sortBy` - Campo para ordenar (id, nombre, apellido, email, cargo, area, estado)
- `order` - Dirección del orden (ASC o DESC)
- `q` - Búsqueda general en nombre, apellido, email y número de empleado
- `nombre` - Filtrar por nombre (búsqueda parcial)
- `apellido` - Filtrar por apellido (búsqueda parcial)
- `cargo` - Filtrar por cargo (búsqueda parcial)
- `area` - Filtrar por área (búsqueda parcial)
- `estado` - Filtrar por estado exacto (ACTIVO, EN_VACACIONES, RETIRADO)

**Ejemplos:**
```
GET /empleados?page=1&size=10
GET /empleados?q=juan
GET /empleados?nombre=Juan&area=Ventas
GET /empleados?estado=ACTIVO&sortBy=apellido&order=ASC
GET /empleados?page=2&size=5&cargo=Gerente
```

**Respuesta con paginación:**
```json
{
  "page": 1,
  "size": 10,
  "totalRecords": 50,
  "totalPages": 5,
  "items": [
    {
      "id": "1",
      "nombre": "Juan",
      "apellido": "Pérez",
      "email": "juan@example.com",
      "numeroEmpleado": "E001",
      "cargo": "Desarrollador",
      "area": "TI",
      "estado": "ACTIVO"
    }
  ]
}
```

### `GET /health`
Health check del servidor

## Formato de Respuestas

### Respuestas Exitosas
Todas las operaciones exitosas devuelven **201 OK** con los datos correspondientes.

### Respuestas de Error
Todos los errores devuelven un formato JSON consistente:

```json
{
  "error": "Not Found",
  "message": "El empleado con id E999 no existe",
  "status": 404,
  "path": "/empleados/E999",
  "timestamp": "2026-02-20T12:34:56.000Z"
}
```

**Códigos de error comunes:**
- `400 Bad Request` - Datos inválidos en la petición
- `404 Not Found` - Recurso no encontrado
- `409 Conflict` - Conflicto (ej: email duplicado)
- `500 Internal Server Error` - Error interno del servidor

## Base de Datos

PostgreSQL con tabla empleados (id, nombre, apellido, email, numero_empleado, cargo, area, estado)
