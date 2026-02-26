# 📧 Servicio de Notificaciones

Microservicio para gestionar notificaciones por email a empleados. Mantiene un historial completo de notificaciones enviadas y procesa eventos del sistema.

## 🚀 Características

- **Historial de notificaciones** completo
- **Envío de emails** usando SMTP (Mailhog para desarrollo)
- **Notificaciones de bienvenida** al crear empleados
- **Notificaciones de desvinculación** al dar de baja empleados
- **Consulta de notificaciones** por empleado o global
- **Estadísticas** de notificaciones enviadas

## 📋 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/notificaciones` | Lista todas las notificaciones |
| `GET` | `/notificaciones/{empleadoId}` | Notificaciones de un empleado |
| `GET` | `/notificaciones/estadisticas/resumen` | Estadísticas generales |
| `POST` | `/notificaciones/evento/empleado-creado` | Evento empleado creado (BIENVENIDA) |
| `POST` | `/notificaciones/evento/empleado-desvinculado` | Evento empleado desvinculado |

## 📨 Tipos de Notificaciones

### 🎉 BIENVENIDA
Enviada automáticamente cuando se registra un nuevo empleado.

**Ejemplo de mensaje:**
```
¡Bienvenido a la empresa Juan Pérez! 

Estamos emocionados de tenerte en el equipo. 

Tu ID de empleado es: E001

Pronto recibirás más información sobre tu onboarding.
```

### 👋 DESVINCULACION
Enviada cuando un empleado es dado de baja.

**Ejemplo de mensaje:**
```
Estimado/a Juan Pérez,

Lamentamos informarte que tu relación laboral con la empresa ha finalizado.

Motivo: Renuncia voluntaria

Te deseamos lo mejor en tus futuros proyectos.
```

## 🗄️ Modelo de Datos

```javascript
{
  "id": 1,                              // Generado automáticamente
  "tipo": "BIENVENIDA",                 // BIENVENIDA | DESVINCULACION
  "destinatario": "juan@empresa.com",   // Email del destinatario
  "mensaje": "¡Bienvenido...",          // Mensaje enviado
  "fechaEnvio": "2024-01-15T10:30:00Z", // Timestamp de envío
  "empleadoId": "E001",                 // ID del empleado
  "estado": "ENVIADA"                   // ENVIADA | FALLIDA | PENDIENTE
}
```

## 📧 Envío de Emails

### Desarrollo Local (Mailhog)
En desarrollo, los emails se capturan con **Mailhog** (no se envían realmente).

**Acceder a la interfaz web:**
```
http://localhost:8025
```

Aquí verás todos los emails "enviados" durante las pruebas.

### Producción (SMTP Real)
Para producción, configurar un servidor SMTP real mediante variables de entorno:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-app
SMTP_FROM="Sistema RH" <rh@empresa.com>
```

## 🔄 Flujo de Eventos

### Evento: empleado.creado

```
┌─────────────────────┐
│ Servicio Empleados  │
│ (Crear empleado)    │
└──────────┬──────────┘
           │
           │ POST /notificaciones/evento/empleado-creado
           │ { empleadoId, nombre, email }
           ▼
┌─────────────────────┐
│ Servicio            │
│ Notificaciones      │
├─────────────────────┤
│ 1. Guardar en DB    │
│ 2. Enviar email     │
│ 3. Actualizar estado│
└──────────┬──────────┘
           │
           ▼
     📧 Email enviado
     💾 Historial guardado
```

### Evento: empleado.desvinculado

Similar al anterior, pero con tipo `DESVINCULACION`.

## 📊 Estados de Notificaciones

| Estado | Descripción |
|--------|-------------|
| `PENDIENTE` | Notificación creada pero no enviada |
| `ENVIADA` | Email enviado exitosamente |
| `FALLIDA` | Error al enviar email (guardado para reintento) |

## 🛠️ Tecnologías

- **Node.js 20** (Alpine)
- **Express.js** - Framework web
- **PostgreSQL 15** - Base de datos
- **Nodemailer** - Envío de emails
- **Mailhog** - SMTP de prueba (desarrollo)
- **Swagger/OpenAPI** - Documentación de API
- **Docker** - Containerización

## 📚 Documentación API

Accede a la documentación interactiva Swagger en:

```
http://localhost:8083/api-docs
```

## 🐳 Ejecutar con Docker

```bash
# Iniciar todos los servicios (incluye Mailhog)
docker-compose up -d

# Ver logs del servicio de notificaciones
docker logs -f notificaciones-app

# Reconstruir solo notificaciones
docker-compose up -d --build notificaciones-service

# Ver interfaz de Mailhog (emails capturados)
http://localhost:8025
```

## 🔍 Health Check

```bash
curl http://localhost:8083/health
```

**Respuesta:**
```json
{
  "status": "UP",
  "timestamp": "2024-01-15T10:30:00Z",
  "service": "notificaciones-service",
  "version": "1.0.0"
}
```

## 📝 Ejemplos de Uso

### Listar todas las notificaciones

```bash
curl http://localhost:8083/notificaciones
```

**Respuesta:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": 1,
      "tipo": "BIENVENIDA",
      "destinatario": "juan@empresa.com",
      "mensaje": "¡Bienvenido a la empresa Juan Pérez!...",
      "fechaEnvio": "2024-01-15T10:30:00Z",
      "empleadoId": "E001",
      "estado": "ENVIADA"
    }
  ],
  "total": 1
}
```

### Listar notificaciones de un empleado

```bash
curl http://localhost:8083/notificaciones/E001
```

### Obtener estadísticas

```bash
curl http://localhost:8083/notificaciones/estadisticas/resumen
```

**Respuesta:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "total": "100",
    "bienvenidas": "75",
    "desvinculaciones": "25",
    "enviadas": "95",
    "fallidas": "3",
    "pendientes": "2"
  }
}
```

### Simular evento empleado.creado (temporal)

```bash
curl -X POST http://localhost:8083/notificaciones/evento/empleado-creado \
  -H "Content-Type: application/json" \
  -d '{
    "empleadoId": "E001",
    "nombre": "Juan Pérez",
    "email": "juan.perez@empresa.com"
  }'
```

**Verifica el email en:**
```
http://localhost:8025
```

### Simular evento empleado.desvinculado (temporal)

```bash
curl -X POST http://localhost:8083/notificaciones/evento/empleado-desvinculado \
  -H "Content-Type: application/json" \
  -d '{
    "empleadoId": "E001",
    "nombre": "Juan Pérez",
    "email": "juan.perez@empresa.com",
    "motivo": "Renuncia voluntaria"
  }'
```

## 🔐 Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servicio | `8083` |
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_USER` | Usuario de la base de datos | `postgres` |
| `DB_PASSWORD` | Contraseña de la base de datos | `postgres` |
| `DB_NAME` | Nombre de la base de datos | `notificaciones_db` |
| `NODE_ENV` | Entorno de ejecución | `production` |
| `SMTP_HOST` | Host del servidor SMTP | `mailhog` |
| `SMTP_PORT` | Puerto SMTP | `1025` |
| `SMTP_FROM` | Email remitente | `"Sistema RH" <rh@empresa.com>` |

## 📊 Estructura de la Base de Datos

```sql
CREATE TABLE notificaciones (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('BIENVENIDA', 'DESVINCULACION')),
    destinatario VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    empleado_id VARCHAR(50) NOT NULL,
    estado VARCHAR(20) DEFAULT 'ENVIADA' 
           CHECK (estado IN ('ENVIADA', 'FALLIDA', 'PENDIENTE'))
);

-- Índices
CREATE INDEX idx_notificaciones_empleado_id ON notificaciones(empleado_id);
CREATE INDEX idx_notificaciones_tipo ON notificaciones(tipo);
CREATE INDEX idx_notificaciones_fecha_envio ON notificaciones(fecha_envio DESC);
CREATE INDEX idx_notificaciones_estado ON notificaciones(estado);
```

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────┐
│ Servicio de Notificaciones (Puerto 8083)│
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │   Routes     │───▶│ Controllers  │  │
│  └──────────────┘    └──────────────┘  │
│                            │            │
│                            ▼            │
│                     ┌──────────────┐   │
│                     │   Services   │   │
│                     │  - Email     │   │
│                     │  - Notif.    │   │
│                     └──────────────┘   │
│                            │            │
│                    ┌───────┴────────┐  │
│                    ▼                ▼  │
│          ┌──────────────┐  ┌─────────┐│
│          │ Repositories │  │Nodemailer││
│          └──────────────┘  └─────────┘│
│                    │                │ │
│                    ▼                ▼ │
│          ┌──────────────┐  ┌─────────┐│
│          │  PostgreSQL  │  │ Mailhog ││
│          │ (notif_db)   │  │ (SMTP)  ││
│          └──────────────┘  └─────────┘│
└─────────────────────────────────────────┘
```

## 🔮 Migración a RabbitMQ

Este servicio actualmente usa endpoints HTTP para recibir eventos. En el futuro migrará a RabbitMQ para comunicación asíncrona.

Ver: [MESSAGE_BROKER_RABBITMQ.md](../MESSAGE_BROKER_RABBITMQ.md)

**Implementación futura:**
```javascript
// Consumir eventos de RabbitMQ
eventConsumer.subscribe('empleado.creado', async (evento) => {
  await notificacionService.procesarEmpleadoCreado(
    evento.empleadoId, 
    evento.nombre, 
    evento.email
  );
});

eventConsumer.subscribe('empleado.desvinculado', async (evento) => {
  await notificacionService.procesarEmpleadoDesvinculado(
    evento.empleadoId, 
    evento.nombre, 
    evento.email,
    evento.motivo
  );
});
```

## 🔮 Roadmap

- [x] Historial de notificaciones
- [x] Envío de emails con Nodemailer
- [x] Integración con Mailhog para desarrollo
- [ ] Migrar a RabbitMQ para eventos asíncronos
- [ ] Plantillas HTML para emails
- [ ] Soporte para adjuntos
- [ ] Notificaciones por SMS
- [ ] Notificaciones push
- [ ] Panel de administración de plantillas
- [ ] Reintentos automáticos para emails fallidos
- [ ] Métricas con Prometheus

---

**Puerto:** 8083  
**Base de datos:** PostgreSQL (puerto 5435)  
**Mailhog Web UI:** http://localhost:8025  
**Documentación:** http://localhost:8083/api-docs
