# Guía de Observabilidad - Sistema de Microservicios

Este documento describe la arquitectura de observabilidad implementada en el ecosistema de microservicios para el Reto 7.

## 1. Introducción a la Observabilidad

La observabilidad responde a tres preguntas clave en sistemas distribuidos:

### 1.1 Las Tres Pilares de la Observabilidad

| Pilar | Descripción | Propósito |
|-------|-------------|----------|
| **Métricas** | Mediciones numéricas de eventos del sistema | Entender cómo se comporta el sistema (latencia, throughput, errores) |
| **Logs** | Registros detallados de eventos individuales | Investigar qué sucedió exactamente en un momento específico |
| **Trazas** | Rastreo de peticiones a través de múltiples servicios | Entender el flujo de una transacción completa |

### 1.2 Preguntas que responde la Observabilidad

- **¿Está vivo el sistema?** → Health Checks (`/health`)
- **¿Cómo se está comportando?** → Métricas (CPU, memoria, latencia, errores)
- **¿Qué hizo exactamente?** → Logs estructurados (trazabilidad)
- **¿Dónde están los cuellos de botella?** → Trazas distribuidas (rastreo de llamadas entre servicios)

---

## 2. Componentes del Stack de Observabilidad

### 2.1 Prometheus (Almacenamiento de Métricas)

**URL:** http://localhost:9090

Prometheus es un sistema de recolección y almacenamiento de métricas que utiliza el modelo **Pull**:

- Los servicios exponen un endpoint `/metrics` en formato Prometheus
- Prometheus "raspa" (scrape) periódicamente estos endpoints
- Las métricas se almacenan en una base de datos time-series

**Archivos de configuración:**
- `observability/prometheus/prometheus.yml` - Configuración de scrape jobs
- `observability/prometheus/alert_rules.yml` - Reglas de alerta

**Métrica de referencia para Prometheus:**
```promql
# Verificar estado de servicios (0=DOWN, 1=UP)
up{job="empleados-service"}

# Ver tasa de peticiones
rate(http_requests_total[5m])

# Ver latencia promedio
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

### 2.2 Grafana (Visualización)

**URL:** http://localhost:3000  
**Credenciales:** admin / admin

Grafana es la capa de visualización que conecta con Prometheus y Loki como fuentes de datos:

- **Dashboards:** Visualizaciones en tiempo real de métricas
- **Alertas:** Reglas que se disparan cuando métricas salen de umbrales
- **Datasources:** Conexiones a Prometheus y Loki

**Dashboard incluido:**
- `Ecosistema de Microservicios - Dashboard Principal`: Estado de servicios, tasa de peticiones, latencia y errores

### 2.3 Zipkin (Trazabilidad Distribuida)

**URL:** http://localhost:9411

Zipkin es el servidor central de trazas distribuidas (modelo Push). OpenTelemetry en cada servicio envía trazas a Zipkin:

- Cada petición obtiene un `traceId` único
- El `traceId` viaja en cabeceras HTTP entre servicios (W3C Trace Context)
- En Zipkin se puede visualizar la cascada completa: qué servicios fueron llamados y cuánto tardó cada uno

**Flujo de trazas:**
```
Gateway (8085) 
  → Auth Service (8084)
  → Empleados Service (8080)
    → Departamentos Service (8081)
    → RabbitMQ → Perfiles, Notificaciones
```

### 2.4 Loki (Agregación de Logs)

**URL:** http://localhost:3100 (API)  
**Interfaz:** En Grafana (Explore → Loki)

Loki es el sistema ligero de agregación de logs de Grafana Labs:

- Promtail recolecta logs de todos los contenedores Docker
- Los logs se filtran y etiquetan automáticamente por servicio
- Se pueden correlacionar logs con trazas usando el `traceId`

**Campos clave en logs JSON:**
```json
{
  "timestamp": "2026-04-30T15:00:00Z",
  "level": "INFO",
  "service": "empleados-service",
  "traceId": "abc123def456",  // Correlaciona con Zipkin
  "message": "Empleado creado",
  "employeeId": "E010"
}
```

### 2.5 Promtail (Recolector de Logs)

Promtail es el agente que descubre automáticamente contenedores Docker y recolecta sus logs:

- Configurable en `observability/promtail/promtail-config.yml`
- Accede al socket de Docker (`/var/run/docker.sock`) para descubrir contenedores
- Envía logs a Loki

---

## 3. Cómo se Configura la Observabilidad por Lenguaje

### 3.1 Node.js (Express)

**Servicios:** empleados, auth, gateway

**Librerías requeridas en package.json:**
```json
{
  "@opentelemetry/sdk-node": "^0.x.x",
  "@opentelemetry/auto-instrumentations-node": "^0.x.x",
  "@opentelemetry/exporter-zipkin": "^0.x.x",
  "prom-client": "^15.x.x"
}
```

**Configuración en app.js:**
```javascript
// Al inicio del archivo
const { initTelemetry } = require('./src/config/telemetry');
initTelemetry('empleados-service');

const { metricsMiddleware, setupMetricsEndpoint } = require('./src/config/prometheus');
app.use(metricsMiddleware);
setupMetricsEndpoint(app);

// Registrar rutas
const healthRoutes = require('./src/routes/healthRoutes');
app.use(healthRoutes);
```

**Endpoints expuestos:**
- `/metrics` → Métricas Prometheus
- `/health` → Health check

### 3.2 Python (FastAPI)

**Servicio:** departamentos

**Librerías requeridas en requirements.txt:**
```
opentelemetry-api
opentelemetry-sdk
opentelemetry-exporter-zipkin
prometheus-client
prometheus-fastapi-instrumentator
opentelemetry-instrumentation-fastapi
opentelemetry-instrumentation-requests
opentelemetry-instrumentation-sqlalchemy
```

**Configuración en main.py:**
```python
from fastapi import FastAPI
from app.telemetry import init_telemetry
from app.prometheus_metrics import setup_metrics
from app.health import router as health_router

app = FastAPI()

# Inicializar telemetría
init_telemetry(app, "departamentos-service")

# Configurar métricas
setup_metrics(app)

# Registrar rutas de salud
app.include_router(health_router)
```

**Endpoints expuestos:**
- `/metrics` → Métricas Prometheus
- `/health` → Health check

### 3.3 Go (Gin)

**Servicio:** perfiles

**Módulos requeridos en go.mod:**
```
go.opentelemetry.io/otel
go.opentelemetry.io/otel/exporters/zipkin
go.opentelemetry.io/otel/sdk
github.com/prometheus/client_golang
```

**Configuración en main.go:**
```go
package main

import (
    "context"
    "your-module/internal/telemetry"
    "your-module/internal/middleware"
    "your-module/internal/api"
)

func main() {
    // Inicializar telemetría
    shutdown := telemetry.InitTelemetry("perfiles-service")
    defer shutdown(context.Background())

    // Registrar métricas
    middleware.RegisterMetrics()

    // Configurar rutas Gin
    engine := gin.Default()
    engine.Use(middleware.MetricsMiddleware())
    
    engine.GET("/metrics", middleware.MetricsHandler())
    engine.GET("/health", api.HealthCheckHandler)
}
```

**Endpoints expuestos:**
- `/metrics` → Métricas Prometheus
- `/health` → Health check

### 3.4 Java (Spring Boot)

**Servicio:** notificaciones

**Dependencias en pom.xml:**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
<dependency>
    <groupId>io.opentelemetry.javaagent</groupId>
    <artifactId>opentelemetry-javaagent</artifactId>
    <version>1.x.x</version>
</dependency>
```

**Configuración en application.yml:**
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,prometheus,metrics
  endpoint:
    health:
      show-details: always

otel:
  exporter:
    zipkin:
      endpoint: ${OTEL_EXPORTER_ZIPKIN_ENDPOINT}
```

**Endpoints expuestos:**
- `/actuator/prometheus` → Métricas Prometheus
- `/actuator/health` → Health check

---

## 4. Variables de Entorno de OpenTelemetry

Todos los servicios usan estas variables (definidas en docker-compose.yml):

```bash
OTEL_SERVICE_NAME=<nombre-del-servicio>
OTEL_EXPORTER_ZIPKIN_ENDPOINT=http://zipkin:9411/api/v2/spans
OTEL_PROPAGATORS=tracecontext,baggage
```

---

## 5. Endpoints de Observabilidad Expuestos

| Componente | URL | Propósito |
|------------|-----|----------|
| **Prometheus** | http://localhost:9090 | Explorador de métricas y reglas de alerta |
| **Grafana** | http://localhost:3000 | Dashboards y gestión de alertas |
| **Zipkin** | http://localhost:9411 | Visualización de trazas distribuidas |
| **Loki API** | http://localhost:3100 | API de logs (accesible desde Grafana) |

---

## 6. Cómo Visualizar Observabilidad

### 6.1 Verificar estado de servicios

1. Abrir Prometheus: http://localhost:9090
2. Ir a **Status** → **Targets**
3. Todos los servicios deben mostrar estado **UP**

### 6.2 Ver métricas en tiempo real

1. Abrir Grafana: http://localhost:3000
2. Seleccionar el dashboard **"Ecosistema de Microservicios - Dashboard Principal"**
3. Ver paneles de:
   - Estado de servicios (verde=UP, rojo=DOWN)
   - Tasa de peticiones por segundo
   - Latencia promedio
   - Errores HTTP

### 6.3 Rastrear una petición completa

1. Abrir Zipkin: http://localhost:9411
2. Hacer una petición que cruce múltiples servicios (ej: crear empleado)
3. En Zipkin, buscar la traza reciente
4. Visualizar la cascada de llamadas entre servicios

### 6.4 Explorar logs

1. Abrir Grafana: http://localhost:3000
2. Ir a **Explore** → Seleccionar datasource **Loki**
3. Filtrar por servicio, nivel de log, o buscar texto
4. Correlacionar con trazas usando el `traceId`

---

## 7. Reglas de Alerta Configuradas

Las alertas se definen en `observability/prometheus/alert_rules.yml`:

| Alerta | Condición | Severidad |
|--------|-----------|-----------|
| **Servicio Caído** | `up == 0` durante 1 min | CRITICAL |
| **Alta Tasa de Errores** | 5xx > 10% durante 2 min | WARNING |
| **Alta Latencia** | Promedio > 2 seg durante 2 min | WARNING |
| **Errores de BD** | Fallos de conexión | WARNING |

Las alertas se envían a:
- Email: admin@empresa.com (configurable)

---

## 8. Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                      Cliente Externo                             │
└────────────────────────┬──────────────────────────────────────┘
                        │
              ┌─────────▼──────────┐
              │  Gateway Service   │ 8085
              │  (Node.js)         │
              │  /health, /metrics │
              └─────────┬──────────┘
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
┌──▼───┐  ┌──────┐ ┌──▼───┐  ┌──────┐ ┌──▼──┐
│ Auth │  │Emp.  │ │Dept. │  │Perf. │ │Notif│
│ 8084 │  │8080  │ │8081  │  │8082  │ │8083 │
└──┬───┘  └──┬───┘ └──┬───┘  └──┬───┘ └──┬──┘
   │         │        │        │       │
   └─────────┴────┬───┴────────┴───────┘
                  │
           ┌──────▼──────────┐
           │   RabbitMQ      │
           │   (Eventos)     │
           └─────────────────┘

         ▼ Trazas (Push)
    ┌────────────┐
    │   Zipkin   │ 9411  ◄─── Todas las trazas se envían aquí
    │ (Trazas)   │
    └────────────┘

         ▼ Métricas (Pull)
    ┌────────────┐
    │ Prometheus │ 9090  ◄─── Raspa /metrics cada 15 segundos
    │ (Métricas) │
    └────┬───────┘
         │
    ┌────▼───────┐
    │  Grafana   │ 3000  ◄─── Visualiza Prometheus y Loki
    │ (Dashboards)│
    └────────────┘

         ▼ Logs (Push)
    ┌────────────┐
    │   Loki     │ 3100  ◄─── Promtail envía logs aquí
    │   (Logs)   │
    └────────────┘

    ┌────────────┐
    │  Promtail  │       ◄─── Recolecta logs de Docker
    │  (Agent)   │
    └────────────┘
```

---

## 9. Cómo Agregar un Nuevo Microservicio

Si necesitas agregar observabilidad a un nuevo servicio:

### Paso 1: Agregar al docker-compose.yml
```yaml
mi-servicio:
  # ... configuración existente ...
  environment:
    - OTEL_SERVICE_NAME=mi-servicio
    - OTEL_EXPORTER_ZIPKIN_ENDPOINT=http://zipkin:9411/api/v2/spans
    - OTEL_PROPAGATORS=tracecontext,baggage
```

### Paso 2: Instrumentar según lenguaje
- Instalar librerías de OpenTelemetry y Prometheus
- Inicializar telemetría al startup
- Agregar middleware de métricas
- Exponer endpoint `/health` y `/metrics`

### Paso 3: Actualizar Prometheus
```yaml
# observability/prometheus/prometheus.yml
scrape_configs:
  - job_name: 'mi-servicio'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['mi-servicio:8000']
```

---

## 10. Referencias

- **OpenTelemetry:** https://opentelemetry.io/
- **Prometheus:** https://prometheus.io/
- **Grafana:** https://grafana.com/
- **Zipkin:** https://zipkin.io/
- **Loki:** https://grafana.com/oss/loki/
- **W3C Trace Context:** https://www.w3.org/TR/trace-context/
