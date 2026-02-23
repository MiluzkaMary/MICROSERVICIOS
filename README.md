# Microservicios 

Sistema de microservicios con arquitectura desacoplada para gestión de empleados y departamentos.

## 🏗️ Arquitectura

```
Reto1/
├── docker-compose.yml          # Orquestación única de todos los servicios
├── servidor-empleados/         # Microservicio de Empleados
│   ├── src/                    # Código fuente
│   │   ├── utils/              # Utilidades (httpClient para comunicación)
│   │   ├── config/             # Configuración (database)
│   │   ├── controllers/        # Controladores
│   │   ├── services/           # Lógica de negocio
│   │   ├── repositories/       # Acceso a datos
│   │   ├── models/             # Modelos de dominio
│   │   └── validators/         # Validaciones
│   ├── Dockerfile              # Imagen Docker
│   ├── init.sql                # Esquema BD empleados
│   └── package.json
└── servidor-departamentos/     # Microservicio de Departamentos
    ├── src/                    # Código fuente (misma estructura)
    ├── Dockerfile              # Imagen Docker
    ├── init.sql                # Esquema BD departamentos
    └── package.json
```

**⚠️ IMPORTANTE**: Los archivos `docker-compose.yml` dentro de cada servicio han sido eliminados.  
Solo existe el `docker-compose.yml` en la raíz para orquestar toda la infraestructura.

## 🎯 Principios de Microservicios

✅ **Independencia de datos**: Cada servicio tiene su propia base de datos PostgreSQL  
✅ **Desacoplamiento**: Servicios completamente independientes  
✅ **Escalabilidad**: Cada servicio puede escalar independientemente  
✅ **Contenedorización**: Docker para portabilidad y aislamiento  
✅ **Orquestación centralizada**: Un solo `docker-compose.yml` en la raíz  

## 🚀 Inicio Rápido

### Prerrequisitos
- Docker Desktop instalado
- PowerShell (Windows)

### Levantar todos los servicios

Desde la **raíz del proyecto** (donde está `docker-compose.yml`):

```powershell
docker-compose up --build
```

Esto levanta:
- ✅ Servicio Empleados (puerto 8080)
- ✅ Base de datos Empleados (puerto 5432)
- ✅ Servicio Departamentos (puerto 8081)
- ✅ Base de datos Departamentos (puerto 5433)

### Detener todos los servicios

```powershell
docker-compose down
```

### Ver logs en tiempo real

```powershell
docker-compose logs -f
```

## 🌐 Servicios Disponibles

### 📋 Servidor Empleados
- **Puerto**: `8080`
- **Base URL**: `http://localhost:8080`
- **Health Check**: `http://localhost:8080/health`
- **BD Puerto**: `5432`

**Endpoints:**
- `POST /empleados` - Crear empleado
- `GET /empleados/:id` - Obtener empleado por ID
- `GET /empleados` - Listar empleados (con paginación)

### 🏢 Servidor Departamentos
- **Puerto**: `8081`
- **Base URL**: `http://localhost:8081`
- **Health Check**: `http://localhost:8081/health`
- **BD Puerto**: `5433`

**Endpoints:**
- `POST /departamentos` - Crear departamento
- `GET /departamentos/:id` - Obtener departamento por ID
- `GET /departamentos` - Listar departamentos (con paginación)

## 📊 Bases de Datos Independientes

Cada microservicio tiene su propia base de datos PostgreSQL 15 Alpine:

| Servicio | Base de Datos | Puerto Externo | Contenedor |
|----------|--------------|----------------|------------|
| Empleados | empleados_db | 5432 | empleados-postgres |
| Departamentos | departamentos_db | 5433 | departamentos-postgres |

### Conectarse a las bases de datos

**Empleados:**
```powershell
docker exec -it empleados-postgres psql -U postgres -d empleados_db
```

**Departamentos:**
```powershell
docker exec -it departamentos-postgres psql -U postgres -d departamentos_db
```

## 🧪 Ejemplos de Uso

### Crear un departamento
```powershell
curl -X POST http://localhost:8081/departamentos `
  -H "Content-Type: application/json" `
  -d '{\"nombre\": \"Tecnología\", \"descripcion\": \"Desarrollo de software\"}'
```

### Crear un empleado
```powershell
curl -X POST http://localhost:8080/empleados `
  -H "Content-Type: application/json" `
  -d '{\"id\": \"E001\", \"nombre\": \"Juan Pérez\", \"email\": \"juan@example.com\", \"departamentoId\": \"1\", \"fechaIngreso\": \"2024-01-15\"}'
```

### Listar departamentos con paginación
```powershell
curl "http://localhost:8081/departamentos?page=1&size=10"
```

### Listar empleados con filtros
```powershell
curl "http://localhost:8080/empleados?page=1&size=5&q=juan"
```

## 🔧 Comandos Útiles

### Reconstruir servicios después de cambios en el código
```powershell
docker-compose down
docker-compose up --build
```

### Reconstruir solo un servicio específico
```powershell
docker-compose up --build empleados-service
docker-compose up --build departamentos-service
```

### Ver estado de contenedores
```powershell
docker-compose ps
```

### Eliminar volúmenes (datos de BD)
```powershell
docker-compose down -v
```

## 📝 Códigos de Estado HTTP

Todos los servicios usan **201 Created** para operaciones exitosas (convención del proyecto):

- **201**: Operación exitosa (GET, POST)
- **400**: Bad Request (datos inválidos)
- **404**: Not Found (recurso no existe)
- **409**: Conflict (duplicado)
- **500**: Internal Server Error

## 📂 Documentación Individual

- [Servidor Empleados](./servidor-empleados/README.md)
- [Servidor Departamentos](./servidor-departamentos/README.md)

## 🐳 Buenas Prácticas Implementadas

1. **Un solo docker-compose.yml** en la raíz para orquestar todo
2. **Multi-stage builds** en Dockerfiles para imágenes optimizadas
3. **Health checks** para garantizar disponibilidad
4. **Usuarios no privilegiados** en contenedores (seguridad)
5. **Volúmenes nombrados** para persistencia de datos
6. **Red compartida** para comunicación entre contenedores
7. **Variables de entorno** para configuración
8. **Arquitectura en capas** (Controller → Service → Repository)
9. **Validación de datos** centralizada
10. **Manejo de errores** consistente

## 🎓 Materia: Microservicios

Este proyecto implementa conceptos clave de arquitectura de microservicios:
- ✅ Desacoplamiento por servicio y base de datos
- ✅ Independencia de despliegue
- ✅ Escalabilidad horizontal
- ✅ Resiliencia y tolerancia a fallos
- ✅ API REST para comunicación
- ✅ Comunicación HTTP entre servicios con reintentos y timeouts
- ✅ Manejo de errores consistente y circuit breaker básico

## 🔄 Comunicación Entre Servicios

### Flujo de Creación de Empleado

```
Cliente → POST /empleados (empleados-service)
   ↓
empleados-service → GET /departamentos/{id} (departamentos-service)
   ↓
departamentos-service responde:
   ├─ 201/200 → ✅ empleados-service guarda en DB → 201 Created
   ├─ 404     → ❌ empleados-service → 400 Bad Request
   └─ timeout → ❌ empleados-service → 503 Service Unavailable
```

### Características de Comunicación HTTP

**Configuración de reintentos:**
- ⏱️ **Timeout**: 3 segundos por petición
- 🔁 **Reintentos**: 2 reintentos automáticos
- ⏳ **Delay entre reintentos**: 500ms
- 🛡️ **Circuit breaker básico**: Falla rápido si el servicio está caído

**Códigos de respuesta:**
- `201 Created` - Empleado creado exitosamente (departamento validado)
- `400 Bad Request` - Departamento no existe
- `503 Service Unavailable` - Servicio de departamentos no disponible
- `502 Bad Gateway` - Error en validación de departamento
- `500 Internal Server Error` - Error interno

### Variables de Entorno

El servicio de empleados usa estas variables para comunicarse:
```bash
DEPARTAMENTOS_SERVICE_HOST=departamentos-service
DEPARTAMENTOS_SERVICE_PORT=8081
```
