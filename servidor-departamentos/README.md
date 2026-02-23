# Servidor Departamentos

Microservicio para gestión de departamentos con Node.js, Express y PostgreSQL.

## Estructura

```
servidor-departamentos/
├── src/
│   ├── config/
│   │   └── database.js     # Configuración PostgreSQL
│   ├── models/
│   │   └── departamento.js # Modelo Departamento
│   ├── validators/
│   │   └── departamentoValidator.js # Validaciones
│   ├── repositories/
│   │   └── departamentoRepository.js # Acceso a datos
│   ├── services/
│   │   └── departamentoService.js # Lógica de negocio
│   ├── controllers/
│   │   └── departamentoController.js # Controladores
│   ├── routes/
│   │   └── departamentoRoutes.js # Rutas
│   └── app.js              # Configuración Express
├── index.js                # Punto de entrada
└── init.sql                # Script BD
```

## Endpoints

### `POST /departamentos`
Crear un nuevo departamento

**Request Body:**
```json
{
  "nombre": "Recursos Humanos",
  "descripcion": "Gestión de personal y nómina"
}
```

**Respuesta: 201 Created**
```json
{
  "id": 1,
  "nombre": "Recursos Humanos",
  "descripcion": "Gestión de personal y nómina"
}
```

### `GET /departamentos/:id`
Obtener un departamento por ID

**Respuesta: 201 OK**
```json
{
  "id": 1,
  "nombre": "Recursos Humanos",
  "descripcion": "Gestión de personal y nómina"
}
```

**Respuesta: 404 Not Found** (si no existe)

### `GET /departamentos`
Listar departamentos con soporte para paginación y filtrado

**Query Parameters (opcionales):**
- `page` - Número de página (default: 1, mínimo: 1)
- `size` - Registros por página (default: 10, mínimo: 1, máximo: 100)
- `sortBy` - Campo para ordenar (id, nombre, descripcion)
- `order` - Dirección del orden (ASC o DESC)
- `q` - Búsqueda general en nombre y descripción
- `nombre` - Filtrar por nombre (búsqueda parcial)

**Ejemplos:**
```
GET /departamentos?page=1&size=10
GET /departamentos?q=ventas
GET /departamentos?nombre=Recursos&sortBy=nombre&order=ASC
GET /departamentos?page=2&size=5
```

**Respuesta con paginación: 201 OK**
```json
{
  "page": 1,
  "size": 10,
  "totalRecords": 25,
  "totalPages": 3,
  "items": [
    {
      "id": 1,
      "nombre": "Recursos Humanos",
      "descripcion": "Gestión de personal"
    },
    {
      "id": 2,
      "nombre": "Tecnología",
      "descripcion": "Desarrollo e infraestructura"
    }
  ]
}
```

### `GET /health`
Health check del servidor

**Respuesta: 200 OK**
```json
{
  "status": "OK",
  "service": "servidor-departamentos"
}
```

## Formato de Respuestas

### Respuestas Exitosas
Todas las operaciones exitosas devuelven **201 OK** con los datos correspondientes (excepto `/health` que devuelve 200).

### Respuestas de Error
```json
{
  "error": "Bad Request",
  "message": "Datos inválidos",
  "status": 400,
  "path": "/departamentos",
  "timestamp": "2026-02-23T12:00:00.000Z",
  "errors": ["nombre es requerido"]
}
```

## Puerto
- **Desarrollo local**: 8081
- **Docker**: 8081 (interno y externo)

## Base de Datos
- **PostgreSQL 15 Alpine**
- **Puerto externo**: 5433 (para evitar conflicto con empleados:5432)
- **Puerto interno**: 5432
- **Nombre**: departamentos_db
