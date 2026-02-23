# Servicio de Empleados

Microservicio para la gestión de empleados con comunicación REST hacia el servicio de departamentos.

## 📋 Descripción

Este microservicio maneja todas las operaciones CRUD de empleados e implementa validación de departamentos mediante comunicación HTTP con el servicio de departamentos.

## 🏗️ Arquitectura

```
servidor-empleados/
├── src/
│   ├── config/
│   │   ├── database.js         # Configuración de PostgreSQL
│   │   └── swagger.js          # Configuración de OpenAPI
│   ├── controllers/
│   │   └── empleadoController.js
│   ├── services/
│   │   └── empleadoService.js  # Lógica de negocio + validación departamento
│   ├── repositories/
│   │   └── empleadoRepository.js
│   ├── models/
│   │   └── empleado.js
│   ├── validators/
│   │   └── empleadoValidator.js
│   ├── routes/
│   │   └── empleadoRoutes.js   # Rutas documentadas con JSDoc
│   ├── utils/
│   │   └── httpClient.js       # Cliente HTTP con timeout/reintentos
│   └── app.js                  # Configuración Express + Swagger
├── Dockerfile                  # Multi-stage build
├── init.sql                    # Esquema de base de datos
├── index.js                    # Punto de entrada
└── package.json
```

## 🚀 Despliegue

### Opción 1: Con Docker Compose (Recomendado)

Desde la raíz del proyecto:

```powershell
docker-compose up --build
```

### Opción 2: Standalone (Sin Departamentos)

```powershell
cd servidor-empleados
docker build -t empleados-service .
docker run -p 8080:8080 \
  -e DB_HOST=localhost \
  -e DB_PORT=5432 \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  -e DB_NAME=empleados_db \
  empleados-service
```

**Nota:** Debes tener PostgreSQL corriendo localmente.

## 📚 Documentación API

### Swagger UI
Accede a la documentación interactiva en:
- **URL:** http://localhost:8080/api-docs
- **Especificación JSON:** http://localhost:8080/api-docs.json

### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/empleados` | Crear empleado (valida departamento) |
| `GET` | `/empleados/{id}` | Obtener empleado por ID |
| `GET` | `/empleados` | Listar empleados con paginación |
| `GET` | `/health` | Health check |

## 🧪 Pruebas

### Crear Empleado

**Requisito:** El departamento debe existir en el servicio de departamentos.

```powershell
curl -X POST http://localhost:8080/empleados `
  -H "Content-Type: application/json" `
  -d '{
    \"id\": \"EMP001\",
    \"nombre\": \"Juan Pérez\",
    \"email\": \"juan.perez@empresa.com\",
    \"departamentoId\": \"1\",
    \"fechaIngreso\": \"2024-01-15\"
  }'
```

**Respuesta exitosa (201):**
```json
{
  "id": "EMP001",
  "nombre": "Juan Pérez",
  "email": "juan.perez@empresa.com",
  "departamentoId": "1",
  "fechaIngreso": "2024-01-15"
}
```

**Error - Departamento no existe (400):**
```json
{
  "error": "Bad Request",
  "message": "El departamento con id 999 no existe",
  "status": 400,
  "path": "/empleados",
  "timestamp": "2026-02-23T12:00:00.000Z"
}
```

### Listar Empleados con Paginación

```powershell
# Primera página, 10 empleados
curl "http://localhost:8080/empleados?page=1&size=10"

# Buscar por nombre
curl "http://localhost:8080/empleados?nombre=Juan"

# Filtrar por departamento
curl "http://localhost:8080/empleados?departamentoId=1"

# Ordenar por fecha de ingreso descendente
curl "http://localhost:8080/empleados?sortBy=fecha_ingreso&order=DESC"
```

**Respuesta:**
```json
{
  "items": [
    {
      "id": "EMP001",
      "nombre": "Juan Pérez",
      "email": "juan.perez@empresa.com",
      "departamentoId": "1",
      "fechaIngreso": "2024-01-15"
    }
  ],
  "page": 1,
  "size": 10,
  "totalRecords": 1,
  "totalPages": 1
}
```

### Obtener Empleado por ID

```powershell
curl http://localhost:8080/empleados/EMP001
```

## 🔗 Comunicación con Servicio de Departamentos

### Configuración

El servicio lee estas variables de entorno para localizar el servicio de departamentos:

```env
DEPARTAMENTOS_SERVICE_HOST=departamentos-service
DEPARTAMENTOS_SERVICE_PORT=8081
```

### Flujo de Validación

Al crear un empleado:

1. **POST /empleados** recibe datos del empleado
2. El servicio valida los campos localmente
3. **GET** `http://departamentos-service:8081/departamentos/{departamentoId}`
4. Si el departamento existe (200/201) → Guarda empleado → 201 Created
5. Si no existe (404) → 400 Bad Request
6. Si timeout/fallo → 503 Service Unavailable

### Resiliencia

```javascript
{
  timeout: 3000,        // 3 segundos máximo
  retries: 2,           // 2 reintentos
  retryDelay: 500       // 500ms entre reintentos
}
```

## 💾 Base de Datos

### Esquema

```sql
CREATE TABLE empleados (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    departamento_id VARCHAR(50) NOT NULL,
    fecha_ingreso DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Conexión

Configurada mediante variables de entorno:

```env
DB_HOST=database-empleados
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=empleados_db
```

### Acceder a la BD (Docker)

```powershell
docker exec -it empleados-postgres psql -U postgres -d empleados_db
```

## 🛡️ Validaciones

### Campos Requeridos

- `id`: Identificador único del empleado
- `nombre`: Nombre completo
- `email`: Correo electrónico válido (único)
- `departamentoId`: ID del departamento (debe existir)
- `fechaIngreso`: Fecha de ingreso

### Reglas

- Email debe contener @ y .
- Email se almacena en minúsculas
- departamentoId debe existir en el servicio de departamentos
- No se permiten duplicados de ID o email

## 📊 Códigos de Respuesta HTTP

| Código | Descripción |
|--------|-------------|
| 201 | Empleado creado exitosamente |
| 200 | Empleado encontrado/listado |
| 400 | Datos inválidos o departamento no existe |
| 404 | Empleado no encontrado |
| 409 | Email o ID duplicado |
| 500 | Error interno del servidor |
| 503 | Servicio de departamentos no disponible |

## 🔧 Variables de Entorno

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `PORT` | Puerto del servicio | 8080 |
| `DB_HOST` | Host de PostgreSQL | localhost |
| `DB_PORT` | Puerto de PostgreSQL | 5432 |
| `DB_USER` | Usuario de BD | postgres |
| `DB_PASSWORD` | Contraseña de BD | postgres |
| `DB_NAME` | Nombre de la BD | empleados_db |
| `DEPARTAMENTOS_SERVICE_HOST` | Host del servicio de departamentos | departamentos-service |
| `DEPARTAMENTOS_SERVICE_PORT` | Puerto del servicio de departamentos | 8081 |
| `NODE_ENV` | Entorno de ejecución | production |

## 📝 Logs

El servicio registra:
- Conexiones a base de datos
- Llamadas HTTP al servicio de departamentos
- Errores de validación
- Timeouts y reintentos

```powershell
# Ver logs en tiempo real
docker-compose logs -f empleados-service
```

## 🧩 Dependencias

```json
{
  "express": "^4.19.2",
  "pg": "^8.11.3",
  "swagger-jsdoc": "^6.2.8",
  "swagger-ui-express": "^5.0.0"
}
```

## 📦 Docker

### Build

```powershell
docker build -t empleados-service .
```

### Run

```powershell
docker run -p 8080:8080 \
  -e DB_HOST=host.docker.internal \
  -e DEPARTAMENTOS_SERVICE_HOST=host.docker.internal \
  empleados-service
```

## 🎯 Buenas Prácticas Implementadas

- ✅ Arquitectura en capas
- ✅ Separación de responsabilidades
- ✅ Validación en múltiples niveles
- ✅ Cliente HTTP resiliente (timeout + reintentos)
- ✅ Documentación OpenAPI completa
- ✅ Health checks
- ✅ Manejo de errores centralizado
- ✅ Logs estructurados
- ✅ Variables de entorno para configuración

---

Para más información del sistema completo, consulta [README general](../README_SISTEMA.md).
