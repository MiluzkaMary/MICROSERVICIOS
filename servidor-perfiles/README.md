# 👤 Servicio de Gestión de Perfiles

Microservicio para gestionar perfiles de empleados. Almacena y administra información personal como teléfono, dirección, ciudad y biografía.

## 🚀 Características

- **Consulta de perfiles** por empleadoId
- **Actualización de perfiles** (teléfono, dirección, ciudad, biografía)
- **Listado de todos los perfiles**
- **Creación automática** de perfiles cuando se registra un nuevo empleado

## 📋 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/perfiles` | Lista todos los perfiles |
| `GET` | `/perfiles/{empleadoId}` | Consulta el perfil de un empleado |
| `PUT` | `/perfiles/{empleadoId}` | Actualiza el perfil de un empleado |
| `POST` | `/perfiles/evento/empleado-creado` | Endpoint temporal para evento empleado.creado |

## 🗄️ Modelo de Datos

```javascript
{
  "id": 1,                              // Generado automáticamente
  "empleadoId": "E001",                 // ID del empleado (único)
  "nombre": "Juan Pérez",               // Nombre completo
  "email": "juan.perez@empresa.com",    // Email (único)
  "telefono": "+57 300 123 4567",       // Teléfono (opcional)
  "direccion": "Calle 123 #45-67",      // Dirección (opcional)
  "ciudad": "Bogotá",                   // Ciudad (opcional)
  "biografia": "Desarrollador Full...", // Biografía (opcional)
  "fechaCreacion": "2024-01-15T10:30:00Z",
  "fechaActualizacion": "2024-01-20T14:45:00Z"
}
```

## 🔄 Evento: empleado.creado

Cuando se crea un nuevo empleado en el servicio de empleados, se debe crear automáticamente un perfil por defecto.

### Flujo Actual (Temporal - HTTP)

```
Servicio Empleados → POST http://perfiles-service:8082/perfiles/evento/empleado-creado
```

**Payload del evento:**
```json
{
  "empleadoId": "E001",
  "nombre": "Juan Pérez",
  "email": "juan.perez@empresa.com"
}
```

**Perfil creado automáticamente:**
```json
{
  "id": 1,
  "empleadoId": "E001",
  "nombre": "Juan Pérez",
  "email": "juan.perez@empresa.com",
  "telefono": "",
  "direccion": "",
  "ciudad": "",
  "biografia": "",
  "fechaCreacion": "2024-01-15T10:30:00Z"
}
```

### Flujo Futuro (RabbitMQ)

Ver: [MESSAGE_BROKER_RABBITMQ.md](../MESSAGE_BROKER_RABBITMQ.md) para detalles sobre la migración a RabbitMQ.

## 📦 Respuestas de API

### ✅ Consulta Exitosa (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": 1,
    "empleadoId": "E001",
    "nombre": "Juan Pérez",
    "email": "juan.perez@empresa.com",
    "telefono": "+57 300 123 4567",
    "direccion": "Calle 123 #45-67",
    "ciudad": "Bogotá",
    "biografia": "Desarrollador Full Stack",
    "fechaCreacion": "2024-01-15T10:30:00Z",
    "fechaActualizacion": "2024-01-20T14:45:00Z"
  }
}
```

### ❌ Perfil No Encontrado (404 Not Found)

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Perfil no encontrado",
  "errors": [
    "No existe un perfil para el empleado con id E999"
  ]
}
```

### ✅ Actualización Exitosa (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Perfil actualizado exitosamente",
  "data": {
    "id": 1,
    "empleadoId": "E001",
    ...
  }
}
```

## 🛠️ Tecnologías

- **Node.js 20** (Alpine)
- **Express.js** - Framework web
- **PostgreSQL 15** - Base de datos
- **Swagger/OpenAPI** - Documentación de API
- **Docker** - Containerización

## 📚 Documentación API

Accede a la documentación interactiva Swagger en:

```
http://localhost:8082/api-docs
```

## 🐳 Ejecutar con Docker

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs del servicio de perfiles
docker logs -f perfiles-app

# Reconstruir solo el servicio de perfiles
docker-compose up -d --build perfiles-service
```

## 🔍 Health Check

```bash
curl http://localhost:8082/health
```

**Respuesta:**
```json
{
  "status": "UP",
  "timestamp": "2024-01-15T10:30:00Z",
  "service": "perfiles-service",
  "version": "1.0.0"
}
```

## 📝 Ejemplos de Uso

### Listar todos los perfiles

```bash
curl http://localhost:8082/perfiles
```

### Consultar perfil de un empleado

```bash
curl http://localhost:8082/perfiles/E001
```

### Actualizar perfil

```bash
curl -X PUT http://localhost:8082/perfiles/E001 \
  -H "Content-Type: application/json" \
  -d '{
    "telefono": "+57 300 123 4567",
    "direccion": "Calle 123 #45-67",
    "ciudad": "Bogotá",
    "biografia": "Desarrollador Full Stack con 5 años de experiencia"
  }'
```

### Simular evento empleado.creado (temporal)

```bash
curl -X POST http://localhost:8082/perfiles/evento/empleado-creado \
  -H "Content-Type: application/json" \
  -d '{
    "empleadoId": "E001",
    "nombre": "Juan Pérez",
    "email": "juan.perez@empresa.com"
  }'
```

## 🔐 Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servicio | `8082` |
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_USER` | Usuario de la base de datos | `postgres` |
| `DB_PASSWORD` | Contraseña de la base de datos | `postgres` |
| `DB_NAME` | Nombre de la base de datos | `perfiles_db` |
| `NODE_ENV` | Entorno de ejecución | `production` |

## 📊 Estructura de la Base de Datos

```sql
CREATE TABLE perfiles (
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

-- Índices
CREATE INDEX idx_perfiles_empleado_id ON perfiles(empleado_id);
CREATE INDEX idx_perfiles_email ON perfiles(email);

-- Trigger para actualizar fecha_actualizacion automáticamente
CREATE TRIGGER trigger_update_fecha_actualizacion
BEFORE UPDATE ON perfiles
FOR EACH ROW
EXECUTE FUNCTION update_fecha_actualizacion();
```

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────┐
│     Servicio de Perfiles (Puerto 8082)  │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │   Routes     │───▶│ Controllers  │  │
│  └──────────────┘    └──────────────┘  │
│                            │            │
│                            ▼            │
│                     ┌──────────────┐   │
│                     │   Services   │   │
│                     └──────────────┘   │
│                            │            │
│                            ▼            │
│                  ┌──────────────────┐  │
│                  │  Repositories    │  │
│                  └──────────────────┘  │
│                            │            │
│                            ▼            │
│                  ┌──────────────────┐  │
│                  │   PostgreSQL     │  │
│                  │  (perfiles_db)   │  │
│                  └──────────────────┘  │
└─────────────────────────────────────────┘
```

## 🔮 Roadmap

- [ ] Migrar a RabbitMQ para eventos asíncronos
- [ ] Añadir foto de perfil (upload de imágenes)
- [ ] Implementar búsqueda de perfiles por ciudad/biografía
- [ ] Añadir validación de números telefónicos por país
- [ ] Implementar caché con Redis
- [ ] Añadir métricas con Prometheus

---

**Puerto:** 8082  
**Base de datos:** PostgreSQL (puerto 5434)  
**Documentación:** http://localhost:8082/api-docs
