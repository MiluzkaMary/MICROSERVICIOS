# Sistema de Microservicios - Gestión de Empleados y Departamentos

Sistema de microservicios con arquitectura desacoplada construido con Node.js, Express, PostgreSQL y Docker.

## 📋 Tabla de Contenidos

- [Arquitectura](#-arquitectura)
- [Características](#-características)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Despliegue](#-instalación-y-despliegue)
- [Documentación API](#-documentación-api-swagger)
- [Pruebas](#-pruebas)
- [Comunicación entre Servicios](#-comunicación-entre-servicios)
- [Resiliencia](#-resiliencia)

---

## 🏗️ Arquitectura

```
Reto/
├── docker-compose.yml              # Orquestación de todos los servicios
├── servidor-empleados/             # Microservicio de Empleados
│   ├── src/
│   │   ├── config/                 # Configuración (database, swagger)
│   │   ├── controllers/            # Controladores HTTP
│   │   ├── services/               # Lógica de negocio
│   │   ├── repositories/           # Acceso a datos
│   │   ├── models/                 # Modelos de dominio
│   │   ├── validators/             # Validaciones
│   │   ├── routes/                 # Rutas API
│   │   └── utils/                  # Utilidades (httpClient)
│   ├── Dockerfile                  # Multi-stage build
│   ├── init.sql                    # Esquema BD
│   └── package.json
└── servidor-departamentos/         # Microservicio de Departamentos
    └── (misma estructura)
```

### Servicios Desplegados

| Servicio | Puerto | Descripción | Swagger UI |
|----------|--------|-------------|------------|
| **Empleados API** | 8080 | CRUD de empleados | http://localhost:8080/api-docs |
| **Departamentos API** | 8081 | CRUD de departamentos | http://localhost:8081/api-docs |
| **DB Empleados** | 5432 | PostgreSQL 15 | - |
| **DB Departamentos** | 5433 | PostgreSQL 15 | - |

---

## ✨ Características

### Principios de Microservicios

✅ **Base de datos independiente por servicio**  
✅ **Comunicación HTTP REST entre servicios**  
✅ **Contenedorización con Docker**  
✅ **Health checks para monitoreo**  
✅ **Configuración mediante variables de entorno**  
✅ **Documentación OpenAPI/Swagger**  

### Resiliencia

✅ **Timeout de 3 segundos** en llamadas HTTP  
✅ **2 reintentos automáticos** con delay de 500ms  
✅ **Manejo robusto de errores** (404, 503, timeout)  
✅ **Health checks** con reintentos automáticos  
✅ **Depends_on** para orden de inicio correcto  

---

## 🔧 Requisitos Previos

- **Docker Desktop** instalado y corriendo
- **PowerShell** (Windows) o terminal compatible
- **Postman** (opcional, para pruebas manuales)
- **Git** (para clonar el repositorio)

---

## 🚀 Instalación y Despliegue

### 1. Clonar el Repositorio

```powershell
git clone <url-del-repositorio>
cd Reto1
```

### 2. Levantar Todos los Servicios

Desde la **raíz del proyecto** (donde está `docker-compose.yml`):

```powershell
docker-compose up --build
```

Este comando:
- Construye las imágenes Docker de ambos servicios
- Levanta 4 contenedores (2 APIs + 2 bases de datos)
- Configura la red interna para comunicación entre servicios
- Ejecuta scripts de inicialización de bases de datos
- Expone los puertos al host

**Tiempo estimado:** 2-3 minutos la primera vez

### 3. Verificar que los Servicios Están Activos

```powershell
# Health check de empleados
curl http://localhost:8080/health

# Health check de departamentos
curl http://localhost:8081/health
```

Respuesta esperada:
```json
{"status":"OK","service":"servidor-empleados"}
```

### 4. Acceder a la Documentación Swagger

Abre en tu navegador:

- **Empleados:** http://localhost:8080/api-docs
- **Departamentos:** http://localhost:8081/api-docs

---

## 📚 Documentación API (Swagger)

Ambos servicios incluyen documentación interactiva con **Swagger UI**.

### Empleados API - http://localhost:8080/api-docs

**Endpoints disponibles:**
- `POST /empleados` - Crear empleado (valida departamento)
- `GET /empleados/{id}` - Obtener empleado por ID
- `GET /empleados` - Listar empleados con paginación
- `GET /health` - Health check

### Departamentos API - http://localhost:8081/api-docs

**Endpoints disponibles:**
- `POST /departamentos` - Crear departamento
- `GET /departamentos/{id}` - Obtener departamento por ID
- `GET /departamentos` - Listar departamentos con paginación
- `GET /health` - Health check

---

## 🧪 Pruebas

### Opción 1: Swagger UI (Recomendado)

1. Abre http://localhost:8080/api-docs o http://localhost:8081/api-docs
2. Haz clic en el endpoint que deseas probar
3. Haz clic en "Try it out"
4. Ingresa los parámetros/body
5. Haz clic en "Execute"

### Opción 2: cURL (Terminal)

**Crear departamento:**
```powershell
curl -X POST http://localhost:8081/departamentos `
  -H "Content-Type: application/json" `
  -d '{\"nombre\": \"Tecnología\", \"descripcion\": \"Desarrollo de software\"}'
```

**Listar departamentos:**
```powershell
curl http://localhost:8081/departamentos
```

**Crear empleado:**
```powershell
curl -X POST http://localhost:8080/empleados `
  -H "Content-Type: application/json" `
  -d '{\"id\": \"EMP001\", \"nombre\": \"Juan Pérez\", \"email\": \"juan@empresa.com\", \"departamentoId\": \"1\", \"fechaIngreso\": \"2024-01-15\"}'
```

**Listar empleados paginados:**
```powershell
curl "http://localhost:8080/empleados?page=1&size=10"
```

### Opción 3: Postman

1. Importa la colección desde http://localhost:8080/api-docs.json
2. Configura el entorno con `baseUrl = http://localhost:8080`
3. Ejecuta las peticiones

---

## 🔗 Comunicación entre Servicios

### Escenario: Crear Empleado

**Flujo completo:**

```
Cliente → POST /empleados → Servicio Empleados
                              ↓
                    Validar departamento
                              ↓
           GET http://departamentos-service:8081/departamentos/{id}
                              ↓
                    Servicio Departamentos
                              ↓
                 200 OK (existe) o 404 (no existe)
                              ↓
           Si existe: Guardar empleado → 201 Created
           Si no existe: → 400 Bad Request
           Si timeout: → 503 Service Unavailable
```

### Hostnames

**Comunicación INTERNA (entre contenedores):**
- Servicio de empleados llama a: `http://departamentos-service:8081`
- Configurado en variables de entorno del docker-compose

**Comunicación EXTERNA (tu PC → contenedores):**
- Usa `http://localhost:8080` y `http://localhost:8081`
- Los puertos están mapeados al host

---

## 🛡️ Resiliencia

### Timeout y Reintentos

El servicio de empleados implementa:

```javascript
{
  timeout: 3000,        // 3 segundos máximo por petición
  retries: 2,           // 2 reintentos automáticos
  retryDelay: 500       // 500ms entre reintentos
}
```

### Manejo de Errores

| Escenario | HTTP Code | Respuesta |
|-----------|-----------|-----------|
| Departamento existe | 200/201 | Empleado creado (201) |
| Departamento no existe | 404 | 400 - "departamento no existe" |
| Servicio caído/timeout | Timeout | 503 - "servicio no disponible" |
| Error de validación | 400 | 400 - errores específicos |
| Duplicado | 409 | 409 - "registro duplicado" |

---

## 🛠️ Comandos Útiles

### Detener Servicios

```powershell
docker-compose down
```

### Reconstruir tras Cambios en el Código

```powershell
docker-compose down; docker-compose up --build
```

### Ver Logs en Tiempo Real

```powershell
# Todos los servicios
docker-compose logs -f

# Solo empleados
docker-compose logs -f empleados-service

# Solo departamentos
docker-compose logs -f departamentos-service
```

### Acceder a las Bases de Datos

```powershell
# Base de datos de empleados
docker exec -it empleados-postgres psql -U postgres -d empleados_db

# Base de datos de departamentos
docker exec -it departamentos-postgres psql -U postgres -d departamentos_db
```

### Ver Estado de Contenedores

```powershell
docker-compose ps
```

---

## 📂 Documentación Individual

Para información específica de cada servicio, consulta:

- [servidor-empleados/README.md](servidor-empleados/README.md)
- [servidor-departamentos/README.md](servidor-departamentos/README.md)

---

## 🎯 Buenas Prácticas Implementadas

✅ **Arquitectura en capas** (Controller → Service → Repository → Model)  
✅ **Inyección de dependencias** mediante módulos  
✅ **Validación en múltiples capas**  
✅ **Manejo centralizado de errores**  
✅ **Logging para debugging**  
✅ **Documentación OpenAPI completa**  
✅ **Health checks para monitoreo**  
✅ **Dockerfiles multi-stage** para imágenes optimizadas  
✅ **Usuario no privilegiado** en contenedores Docker  
✅ **Variables de entorno** para configuración  
✅ **Volúmenes** para persistencia de datos  
