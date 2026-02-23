# Servicio de Departamentos

Microservicio para la gestión de departamentos.

## 📋 Descripción

Este microservicio maneja todas las operaciones CRUD de departamentos. Es consultado por el servicio de empleados para validar la existencia de departamentos durante la creación de empleados.

## 🏗️ Arquitectura

```
servidor-departamentos/
├── src/
│   ├── config/
│   │   ├── database.js         # Configuración de PostgreSQL
│   │   └── swagger.js          # Configuración de OpenAPI
│   ├── controllers/
│   │   └── departamentoController.js
│   ├── services/
│   │   └── departamentoService.js
│   ├── repositories/
│   │   └── departamentoRepository.js
│   ├── models/
│   │   └── departamento.js
│   ├── validators/
│   │   └── departamentoValidator.js
│   ├── routes/
│   │   └── departamentoRoutes.js  # Rutas documentadas con JSDoc
│   └── app.js                     # Configuración Express + Swagger
├── Dockerfile                     # Multi-stage build
├── init.sql                       # Esquema de base de datos + datos iniciales
├── index.js                       # Punto de entrada
└── package.json
```

## 🚀 Despliegue

### Opción 1: Con Docker Compose (Recomendado)

Desde la raíz del proyecto:

```powershell
docker-compose up --build
```

### Opción 2: Standalone

```powershell
cd servidor-departamentos
docker build -t departamentos-service .
docker run -p 8081:8081 \
  -e DB_HOST=localhost \
  -e DB_PORT=5432 \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  -e DB_NAME=departamentos_db \
  departamentos-service
```

**Nota:** Debes tener PostgreSQL corriendo localmente en el puerto 5433.

## 📚 Documentación API

### Swagger UI
Accede a la documentación interactiva en:
- **URL:** http://localhost:8081/api-docs
- **Especificación JSON:** http://localhost:8081/api-docs.json

### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/departamentos` | Crear departamento |
| `GET` | `/departamentos/{id}` | Obtener departamento por ID |
| `GET` | `/departamentos` | Listar departamentos con paginación |
| `GET` | `/health` | Health check |

## 🧪 Pruebas

### Crear Departamento

```powershell
curl -X POST http://localhost:8081/departamentos `
  -H "Content-Type: application/json" `
  -d '{
    \"nombre\": \"Tecnología\",
    \"descripcion\": \"Departamento de desarrollo de software e infraestructura\"
  }'
```

**Respuesta exitosa (201):**
```json
{
  "id": 1,
  "nombre": "Tecnología",
  "descripcion": "Departamento de desarrollo de software e infraestructura"
}
```

**Error - Nombre duplicado (409):**
```json
{
  "error": "Conflict",
  "message": "Ya existe un departamento con el nombre 'Tecnología'",
  "status": 409,
  "path": "/departamentos",
  "timestamp": "2026-02-23T12:00:00.000Z"
}
```

### Listar Departamentos con Paginación

```powershell
# Primera página, 10 departamentos
curl "http://localhost:8081/departamentos?page=1&size=10"

# Buscar por nombre
curl "http://localhost:8081/departamentos?nombre=Tecnología"

# Ordenar por nombre descendente
curl "http://localhost:8081/departamentos?sortBy=nombre&order=DESC"
```

**Respuesta:**
```json
{
  "items": [
    {
      "id": 1,
      "nombre": "Tecnología",
      "descripcion": "Departamento de desarrollo de software e infraestructura"
    },
    {
      "id": 2,
      "nombre": "Recursos Humanos",
      "descripcion": "Gestión de personal y nómina"
    }
  ],
  "page": 1,
  "size": 10,
  "totalRecords": 5,
  "totalPages": 1
}
```

### Obtener Departamento por ID

```powershell
curl http://localhost:8081/departamentos/1
```

**Respuesta (201):**
```json
{
  "id": 1,
  "nombre": "Tecnología",
  "descripcion": "Departamento de desarrollo de software e infraestructura"
}
```

**Error - No encontrado (404):**
```json
{
  "error": "Not Found",
  "message": "Departamento con id 999 no encontrado",
  "status": 404,
  "path": "/departamentos/999",
  "timestamp": "2026-02-23T12:00:00.000Z"
}
```

## 💾 Base de Datos

### Esquema

```sql
CREATE TABLE departamentos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Datos Iniciales

El archivo `init.sql` incluye 5 departamentos de ejemplo:
1. Tecnología
2. Recursos Humanos
3. Ventas
4. Marketing
5. Finanzas

### Conexión

Configurada mediante variables de entorno:

```env
DB_HOST=database-departamentos
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=departamentos_db
```

### Acceder a la BD (Docker)

```powershell
docker exec -it departamentos-postgres psql -U postgres -d departamentos_db
```

**Comandos útiles:**

```sql
-- Ver todos los departamentos
SELECT * FROM departamentos;

-- Contar departamentos
SELECT COUNT(*) FROM departamentos;

-- Buscar por nombre
SELECT * FROM departamentos WHERE nombre ILIKE '%tecno%';
```

## 🛡️ Validaciones

### Campos Requeridos

- `nombre`: Nombre del departamento (único)

### Campos Opcionales

- `descripcion`: Descripción del departamento

### Reglas

- El nombre no puede estar vacío
- El nombre debe ser único
- El ID se genera automáticamente (SERIAL)

## 📊 Códigos de Respuesta HTTP

| Código | Descripción |
|--------|-------------|
| 201 | Departamento creado exitosamente |
| 200 | Departamento encontrado/listado |
| 400 | Datos inválidos |
| 404 | Departamento no encontrado |
| 409 | Nombre duplicado |
| 500 | Error interno del servidor |

## 🔗 Uso por Otros Servicios

### Servicio de Empleados

El servicio de empleados consulta este servicio para validar departamentos:

```
Empleados Service → GET /departamentos/{id} → Departamentos Service
```

**Desde dentro de Docker:**
```
http://departamentos-service:8081/departamentos/1
```

**Desde fuera de Docker (Postman):**
```
http://localhost:8081/departamentos/1
```

## 🔧 Variables de Entorno

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `PORT` | Puerto del servicio | 8081 |
| `DB_HOST` | Host de PostgreSQL | localhost |
| `DB_PORT` | Puerto de PostgreSQL | 5432 |
| `DB_USER` | Usuario de BD | postgres |
| `DB_PASSWORD` | Contraseña de BD | postgres |
| `DB_NAME` | Nombre de la BD | departamentos_db |
| `NODE_ENV` | Entorno de ejecución | production |

## 📝 Logs

El servicio registra:
- Conexiones a base de datos
- Creación/consulta de departamentos
- Errores de validación
- Duplicados detectados

```powershell
# Ver logs en tiempo real
docker-compose logs -f departamentos-service
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
docker build -t departamentos-service .
```

### Run

```powershell
docker run -p 8081:8081 \
  -e DB_HOST=host.docker.internal \
  departamentos-service
```

## 🧪 Pruebas con Swagger UI

1. Abre http://localhost:8081/api-docs
2. Haz clic en el endpoint `POST /departamentos`
3. Haz clic en "Try it out"
4. Ingresa:
   ```json
   {
     "nombre": "Desarrollo",
     "descripcion": "Equipo de desarrollo de productos"
   }
   ```
5. Haz clic en "Execute"
6. Verifica la respuesta 201 Created

## 🎯 Buenas Prácticas Implementadas

- ✅ Arquitectura en capas
- ✅ Separación de responsabilidades
- ✅ Validación en múltiples niveles
- ✅ Prevención de duplicados
- ✅ Documentación OpenAPI completa
- ✅ Health checks
- ✅ Manejo de errores centralizado
- ✅ Logs estructurados
- ✅ Variables de entorno para configuración
- ✅ Datos de ejemplo para pruebas

---

Para más información del sistema completo, consulta [README general](../README_SISTEMA.md).
