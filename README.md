# Sistema de Microservicios - Gestión de Empleados

Sistema distribuido de microservicios para gestión de recursos humanos, implementado con Node.js, Express, PostgreSQL y Docker.

## 📋 Tabla de Contenidos

- [Arquitectura](#-arquitectura)
- [Microservicios](#-microservicios)
- [Inicio Rápido](#-inicio-rápido)
- [Documentación API](#-documentación-api-swagger)
- [Comunicación entre Servicios](#-comunicación-entre-servicios)
- [Patrones Implementados](#-patrones-de-diseño-implementados)
- [Pruebas](#-pruebas)

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                         │
│              (Clientes: Postman, Frontend, etc.)                │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┬───────────────┐
         │               │               │               │
         ▼               ▼               ▼               ▼
┌────────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐
│   EMPLEADOS    │ │DEPARTAMENTOS│ │  PERFILES  │ │NOTIFICACIONES│
│   :8080        │ │   :8081     │ │   :8082    │ │   :8083      │
│                │ │             │ │            │ │              │
│ • CRUD         │ │ • CRUD      │ │ • CRUD     │ │ • Historial  │
│ • Validaciones │ │ • Catálogo  │ │ • Consulta │ │ • Emails     │
│ • Circuit      │ │             │ │ • Consumer │ │ • Consumer   │
│   Breaker      │ │             │ │   RabbitMQ │ │   RabbitMQ   │
│ • Publisher    │ │             │ │            │ │              │
│   RabbitMQ     │ │             │ │            │ │              │
└───┬────────────┘ └──────┬──────┘ └─────┬──────┘ └──────┬───────┘
    │ HTTP sync         │               ▲               ▲
    ├──────────────────►│               │events         │events
    │                   │               │               │
    │ events            │        ┌──────┴───────────────┴──────┐
    └──────────────────────────►│      RabbitMQ :5672          │
                                 │  Exchange: empleados_events  │
                                 │  • empleado.creado           │
                                 │  • empleado.eliminado        │
                                 └──────────────────────────────┘
        │                 │               │               │
        ▼                 ▼               ▼               ▼
┌────────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐
│ PostgreSQL     │ │ PostgreSQL │ │ PostgreSQL │ │ PostgreSQL   │
│ :5432          │ │ :5433      │ │ :5434      │ │ :5435        │
│ empleados_db   │ │ depto_db   │ │ perfiles_db│ │ notif_db     │
└────────────────┘ └────────────┘ └────────────┘ └──────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  📧 Mailhog (:8025) - SMTP de prueba para desarrollo             │
└──────────────────────────────────────────────────────────────────┘
```

### Servicios Desplegados

| Servicio | Puerto | Base de Datos | Descripción | Swagger/UI |
|----------|--------|---------------|-------------|---------|
| **Empleados** | 8080 | 5432 | CRUD empleados + Circuit Breaker + Eventos | http://localhost:8080/api-docs |
| **Departamentos** | 8081 | 5433 | CRUD departamentos | http://localhost:8081/api-docs |
| **Perfiles** | 8082 | 5434 | Perfiles de empleados (consumer) | http://localhost:8082/api-docs |
| **Notificaciones** | 8083 | 5435 | Notificaciones + Emails (consumer) | http://localhost:8083/api-docs |
| **RabbitMQ** | 5672 (AMQP)<br>15672 (UI) | - | Message Broker | http://localhost:15672 |
| **Mailhog** | 1025 (SMTP)<br>8025 (UI) | - | SMTP de prueba | http://localhost:8025 |

---

## 🎯 Microservicios

### 1. Servicio de Empleados (Puerto 8080)
**Responsabilidades:**
- CRUD de empleados
- Validación de departamentos mediante Circuit Breaker
- **Publisher de eventos** en RabbitMQ:
  - `empleado.creado` → Publica cuando se crea un empleado
  - `empleado.eliminado` → Publica cuando se elimina un empleado

**Base de datos:** PostgreSQL (puerto 5432)  
**Exchange RabbitMQ:** `empleados_events` (topic)

### 2. Servicio de Departamentos (Puerto 8081)
**Responsabilidades:**
- CRUD de departamentos
- Catálogo de departamentos disponibles

**Base de datos:** PostgreSQL (puerto 5433)

### 3. Servicio de Perfiles (Puerto 8082)
**Responsabilidades:**
- Gestión de perfiles de empleados (teléfono, dirección, ciudad, biografía)
- **Consumer de eventos RabbitMQ**:
  - Escucha `empleado.creado` → Crea perfil default automáticamente
- Consulta y actualización de perfiles

**Base de datos:** PostgreSQL (puerto 5434)  
**Cola RabbitMQ:** `perfiles.empleado_creado`

### 4. Servicio de Notificaciones (Puerto 8083)
**Responsabilidades:**
- Envío de notificaciones por email (Bienvenida, Desvinculación)
- **Consumer de eventos RabbitMQ**:
  - Escucha `empleado.creado` → Envía email de bienvenida
  - Escucha `empleado.eliminado` → Envía email de desvinculación
- Historial de notificaciones con estados (PENDIENTE, ENVIADA, FALLIDA)
- Estadísticas de notificaciones

**Base de datos:** PostgreSQL (puerto 5435)  
**Colas RabbitMQ:** `notificaciones.empleado_creado`, `notificaciones.empleado_eliminado`  
**SMTP:** Mailhog (puerto 1025)

### 5. RabbitMQ - Message Broker (Puerto 5672/15672)
**Propósito:** Comunicación asíncrona mediante eventos entre microservicios.

**Configuración:**
- **Exchange:** `empleados_events` (tipo: topic)
- **Routing Keys:** `empleado.creado`, `empleado.eliminado`
- **Management UI:** http://localhost:15672 (guest/guest)

### 6. Mailhog - SMTP de Prueba (Puerto 8025)
**Propósito:** Servidor SMTP de desarrollo para capturar y visualizar emails sin enviarlos realmente.
**Responsabilidades:**
- Gestión de perfiles de empleados (teléfono, dirección, ciudad, biografía)
- Creación automática de perfil al recibir evento `empleado.creado`
- Consulta y actualización de perfiles

**Base de datos:** PostgreSQL (puerto 5434)

### 4. Servicio de Notificaciones (Puerto 8083)
**Responsabilidades:**
- Envío de notificaciones por email (Bienvenida, Desvinculación)
- Historial de notificaciones con estados (PENDIENTE, ENVIADA, FALLIDA)
- Procesamiento de eventos de empleados
- Estadísticas de notificaciones

**Base de datos:** PostgreSQL (puerto 5435)  
**SMTP:** Mailhog (puerto 1025)

### 5. Mailhog - SMTP de Prueba (Puerto 8025)
**Propósito:** Servidor SMTP de desarrollo para capturar y visualizar emails sin enviarlos realmente.

---

## ✨ Características

### Principios de Microservicios

✅ **Base de datos independiente por servicio** (4 bases PostgreSQL)  
✅ **Comunicación HTTP REST** para operaciones síncronas (validaciones)  
✅ **Comunicación asíncrona con RabbitMQ** para eventos de negocio  
✅ **Arquitectura orientada a eventos** (Event-Driven Architecture)  
✅ **Contenedorización con Docker**  
✅ **Health checks para monitoreo**  
✅ **Configuración mediante variables de entorno**  
✅ **Documentación OpenAPI/Swagger**  
✅ **Message Broker (RabbitMQ)** para desacoplamiento  
✅ **Servidor SMTP de pruebas (Mailhog)**

### Resiliencia

✅ **Circuit Breaker** (Opossum) en el servicio de empleados  
✅ **Timeout de 3 segundos** en llamadas HTTP síncronas  
✅ **2 reintentos automáticos** con delay de 500ms  
✅ **Manejo robusto de errores** (404, 503, timeout)  
✅ **Health checks** con reintentos automáticos  
✅ **Depends_on** para orden de inicio correcto  
✅ **Estados transaccionales** en notificaciones  
✅ **Garantía de entrega** de eventos mediante RabbitMQ (ACK/NACK)  
✅ **Persistencia de mensajes** en RabbitMQ (durable queues)  
✅ **Reintento automático** de mensajes fallidos  

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

# Health check de perfiles
curl http://localhost:8082/health

# Health check de notificaciones
curl http://localhost:8083/health
```

Respuesta esperada:
```json
{"status":"OK","service":"servidor-empleados","timestamp":"2024-01-15T12:00:00.000Z"}
```

### 4. Acceder a la Documentación Swagger

Abre en tu navegador:

- **Empleados:** http://localhost:8080/api-docs
- **Departamentos:** http://localhost:8081/api-docs
- **Perfiles:** http://localhost:8082/api-docs
- **Notificaciones:** http://localhost:8083/api-docs

### 5. Acceder a Mailhog (Visualizar Emails)

Abre en tu navegador:

- **Mailhog UI:** http://localhost:8025

Aquí podrás ver todos los emails enviados por el servicio de notificaciones.

---

## 📚 Documentación API (Swagger)

Todos los servicios incluyen documentación interactiva con **Swagger UI**.

### Empleados API - http://localhost:8080/api-docs

**Endpoints disponibles:**
- `POST /empleados` - Crear empleado (valida departamento y emite evento)
- `GET /empleados/{id}` - Obtener empleado por ID
- `PUT /empleados/{id}` - Actualizar empleado
- `DELETE /empleados/{id}` - Desvincular empleado (emite evento)
- `GET /empleados` - Listar empleados con paginación
- `GET /health` - Health check

### Departamentos API - http://localhost:8081/api-docs

**Endpoints disponibles:**
- `POST /departamentos` - Crear departamento
- `GET /departamentos/{id}` - Obtener departamento por ID
- `GET /departamentos` - Listar departamentos con paginación
- `GET /health` - Health check

### Perfiles API - http://localhost:8082/api-docs

**Endpoints disponibles:**
- `GET /perfiles` - Listar todos los perfiles
- `GET /perfiles/{empleadoId}` - Obtener perfil de un empleado
- `PUT /perfiles/{empleadoId}` - Actualizar perfil de un empleado
- `POST /perfiles/evento/empleado-creado` - Webhook para creación automática de perfil
- `GET /health` - Health check

### Notificaciones API - http://localhost:8083/api-docs

**Endpoints disponibles:**
- `GET /notificaciones` - Listar todas las notificaciones con paginación
- `GET /notificaciones/{empleadoId}` - Obtener notificaciones de un empleado
- `GET /notificaciones/estadisticas/resumen` - Estadísticas de notificaciones
- `POST /notificaciones/evento/empleado-creado` - Webhook para email de bienvenida
- `POST /notificaciones/evento/empleado-desvinculado` - Webhook para email de desvinculación
- `GET /health` - Health check

---

## 🧪 Pruebas

### Opción 1: Swagger UI (Recomendado)

1. Abre http://localhost:8080/api-docs (o puerto del servicio que quieras probar)
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

**Consultar perfil de empleado:**
```powershell
curl http://localhost:8082/perfiles/EMP001
```

**Actualizar perfil:**
```powershell
curl -X PUT http://localhost:8082/perfiles/EMP001 `
  -H "Content-Type: application/json" `
  -d '{\"telefono\": \"+57 300 1234567\", \"direccion\": \"Calle 123\", \"ciudad\": \"Bogotá\", \"biografia\": \"Desarrollador Full Stack\"}'
```

**Consultar notificaciones de un empleado:**
```powershell
curl http://localhost:8083/notificaciones/EMP001
```

**Ver estadísticas de notificaciones:**
```powershell
curl http://localhost:8083/notificaciones/estadisticas/resumen
```

### Opción 3: Postman

1. Importa la colección desde http://localhost:8080/api-docs.json
2. Configura el entorno con `baseUrl = http://localhost:8080`
3. Ejecuta las peticiones

---

## 🔗 Comunicación entre Servicios

### Escenario 1: Crear Empleado (Síncrono)

**Flujo de validación:**

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

### Escenario 2: Crear Empleado con Eventos (Asíncrono)

**Flujo completo con propagación de eventos:**

```
Cliente → POST /empleados → Servicio Empleados
                              ↓
                         Guardar empleado
                              ↓
                    Emitir evento empleado.creado
                              ↓
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
Servicio Perfiles                      Servicio Notificaciones
        │                                           │
POST /perfiles/evento/empleado-creado   POST /notificaciones/evento/empleado-creado
        │                                           │
  Crear perfil default                        Crear notificación
        │                                           │
    200 OK                                    Enviar email via Mailhog
                                                    │
                                                200 OK
```

### Escenario 3: Desvincular Empleado

```
Cliente → DELETE /empleados/{id} → Servicio Empleados
                                      ↓
                              Desvincular empleado
                                      ↓
                        Emitir evento empleado.desvinculado
                                      ↓
                          Servicio Notificaciones
                                      ↓
              POST /notificaciones/evento/empleado-desvinculado
                                      ↓
                          Enviar email de despedida
                                      ↓
                                   200 OK
```

### Hostnames

**Comunicación INTERNA (entre contenedores):**
- `http://departamentos-service:8081`
- `http://perfiles-service:8082`
- `http://notificaciones-service:8083`
- `http://mailhog:1025` (SMTP)
- Configurados en variables de entorno del docker-compose

**Comunicación EXTERNA (tu PC → contenedores):**
- `http://localhost:8080` - Empleados
- `http://localhost:8081` - Departamentos
- `http://localhost:8082` - Perfiles
- `http://localhost:8083` - Notificaciones
- `http://localhost:8025` - Mailhog UI
- Los puertos están mapeados al host

---

## 🛡️ Resiliencia

### Circuit Breaker (Servicio de Empleados)

Implementado con la librería **Opossum** para proteger las llamadas al servicio de departamentos:

```javascript
{
  timeout: 3000,              // 3 segundos máximo por petición
  errorThresholdPercentage: 50,  // Se abre si el 50% de peticiones fallan
  resetTimeout: 30000,        // Intenta cerrar el circuito después de 30s
  rollingCountTimeout: 10000  // Ventana de tiempo de 10s para estadísticas
}
```

**Estados del Circuit Breaker:**
- **CLOSED:** Funcionamiento normal
- **OPEN:** Demasiados fallos, rechaza peticiones inmediatamente
- **HALF_OPEN:** Probando si el servicio se recuperó

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
| Circuit breaker abierto | N/A | 503 - "servicio temporalmente no disponible" |
| Error de validación | 400 | 400 - errores específicos |
| Duplicado | 409 | 409 - "registro duplicado" |
| Email fallido | N/A | Notificación marcada como FALLIDA |

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

# Solo perfiles
docker-compose logs -f perfiles-service

# Solo notificaciones
docker-compose logs -f notificaciones-service

# Solo mailhog
docker-compose logs -f mailhog
```

### Acceder a las Bases de Datos

```powershell
# Base de datos de empleados
docker exec -it empleados-postgres psql -U postgres -d empleados_db

# Base de datos de departamentos
docker exec -it departamentos-postgres psql -U postgres -d departamentos_db

# Base de datos de perfiles
docker exec -it perfiles-postgres psql -U postgres -d perfiles_db

# Base de datos de notificaciones
docker exec -it notificaciones-postgres psql -U postgres -d notificaciones_db
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
- [servidor-perfiles/README.md](servidor-perfiles/README.md)
- [servidor-notificaciones/README.md](servidor-notificaciones/README.md)

---

## 🚀 Flujo de Trabajo Completo - Ejemplo

### 1. Crear un departamento

```bash
curl -X POST http://localhost:8081/departamentos \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Tecnología", "descripcion": "Desarrollo de software"}'
```

Respuesta:
```json
{"id": 1, "nombre": "Tecnología", "descripcion": "Desarrollo de software"}
```

### 2. Crear un empleado

```bash
curl -X POST http://localhost:8080/empleados \
  -H "Content-Type: application/json" \
  -d '{"id": "EMP001", "nombre": "Juan Pérez", "email": "juan.perez@empresa.com", "departamentoId": "1", "fechaIngreso": "2024-01-15"}'
```

Respuesta:
```json
{"id": "EMP001", "nombre": "Juan Pérez", "email": "juan.perez@empresa.com", "departamentoId": "1", "fechaIngreso": "2024-01-15", "activo": true}
```

**🎉 Esto automáticamente:**
- Crea un perfil en el servicio de Perfiles
- Envía un email de bienvenida (visible en http://localhost:8025)
- Registra la notificación en la base de datos

### 3. Verificar el perfil creado

```bash
curl http://localhost:8082/perfiles/EMP001
```

Respuesta:
```json
{
  "empleadoId": "EMP001",
  "nombre": "Juan Pérez",
  "email": "juan.perez@empresa.com",
  "telefono": "",
  "direccion": "",
  "ciudad": "",
  "biografia": ""
}
```

### 4. Actualizar el perfil

```bash
curl -X PUT http://localhost:8082/perfiles/EMP001 \
  -H "Content-Type: application/json" \
  -d '{"telefono": "+57 300 1234567", "direccion": "Calle 123 #45-67", "ciudad": "Bogotá", "biografia": "Desarrollador Full Stack con 5 años de experiencia"}'
```

### 5. Ver el email de bienvenida

Abre en tu navegador: http://localhost:8025

### 6. Consultar notificaciones del empleado

```bash
curl http://localhost:8083/notificaciones/EMP001
```

Respuesta:
```json
[
  {
    "id": 1,
    "empleadoId": "EMP001",
    "nombre": "Juan Pérez",
    "email": "juan.perez@empresa.com",
    "tipo": "BIENVENIDA",
    "estado": "ENVIADA",
    "fechaCreacion": "2024-01-15T10:30:00.000Z"
  }
]
```

### 7. Ver estadísticas de notificaciones

```bash
curl http://localhost:8083/notificaciones/estadisticas/resumen
```

Respuesta:
```json
{
  "total": 1,
  "enviadas": 1,
  "pendientes": 0,
  "fallidas": 0
}
```

---

## 📜 Patrones de Diseño Implementados

✅ **Arquitectura de Microservicios** - Servicios independientes y autodesplegables  
✅ **Database per Service** - Cada servicio tiene su propia base de datos  
✅ **API Gateway Pattern** - Preparado para integración futura  
✅ **Circuit Breaker** - Protección contra fallos en cascada (Opossum)  
✅ **Event-Driven Architecture** - Comunicación asíncrona mediante eventos  
✅ **Retry Pattern** - Reintentos automáticos con delay exponencial  
✅ **Health Check Pattern** - Endpoints para monitoreo de salud  
✅ **Repository Pattern** - Abstracción de acceso a datos  
✅ **Service Layer Pattern** - Lógica de negocio separada de controladores  
✅ **Dependency Injection** - Bajo acoplamiento entre capas  
✅ **Factory Pattern** - Creación de objetos (perfiles y notificaciones default)  
✅ **Strategy Pattern** - Diferentes estrategias de envío de notificaciones

---

## 🎯 Buenas Prácticas Implementadas

✅ **Arquitectura en capas** (Controller → Service → Repository → Model)  
✅ **Inyección de dependencias** mediante módulos  
✅ **Validación en múltiples capas** (validators + models)  
✅ **Manejo centralizado de errores**  
✅ **Logging para debugging**  
✅ **Documentación OpenAPI 3.0 completa** en todos los servicios  
✅ **Health checks** para monitoreo en todos los servicios  
✅ **Dockerfiles multi-stage** para imágenes optimizadas  
✅ **Usuario no privilegiado** (nodejs:1001) en contenedores Docker  
✅ **Variables de entorno** para configuración dinámica  
✅ **Volúmenes nombrados** para persistencia de datos  
✅ **Separación de concerns** - Cada servicio tiene una responsabilidad única  
✅ **Idempotencia** - Operaciones seguras para reintentos  
✅ **RESTful API design** - Uso correcto de verbos HTTP  
✅ **Versionado implícito** - Preparado para versionado de API  
✅ **SMTP local con Mailhog** - Testing sin servicios externos  
✅ **Estados transaccionales** - Seguimiento de estados en notificaciones  
✅ **Factory methods** - Creación consistente de objetos default  
✅ **Circuit breaker configurado correctamente** - Sin wrappers redundantes  

---

## 🔮 Roadmap Futuro

### Próximas Mejoras Planeadas

🔲 **Message Broker con RabbitMQ** - Migrar eventos HTTP a RabbitMQ  
🔲 **API Gateway** - Kong o Nginx como punto de entrada único  
🔲 **Service Discovery** - Consul o Eureka para descubrimiento dinámico  
🔲 **Distributed Tracing** - Jaeger o Zipkin para trazabilidad  
🔲 **Centralized Logging** - ELK Stack (Elasticsearch, Logstash, Kibana)  
🔲 **Metrics & Monitoring** - Prometheus + Grafana  
🔲 **Authentication & Authorization** - JWT + OAuth2  
🔲 **Rate Limiting** - Protección contra abuso de API  
🔲 **Database Migrations** - Flyway o Liquibase  
🔲 **Integration Tests** - Pruebas de integración con Testcontainers  
🔲 **CI/CD Pipeline** - GitHub Actions o Jenkins  
🔲 **Kubernetes Deployment** - Orquestación en producción  

---

## 📞 Soporte

Para preguntas o reportar problemas:

1. Revisa la [documentación individual de cada servicio](servidor-empleados/README.md)
2. Verifica los logs: `docker-compose logs -f`
3. Consulta el archivo [MESSAGE_BROKER_RABBITMQ.md](MESSAGE_BROKER_RABBITMQ.md) para arquitectura futura

---

**Desarrollado con ❤️ para el curso de Microservicios**  
