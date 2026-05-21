# Dependencias de Observabilidad por Servicio

Este documento lista todas las dependencias necesarias para instrumentar cada microservicio con OpenTelemetry y Prometheus.

## Node.js (servidor-empleados, servidor-auth, servidor-gateway)

**Agregar a `package.json`:**

```json
{
  "dependencies": {
    "@opentelemetry/sdk-node": "^0.50.0",
    "@opentelemetry/auto-instrumentations-node": "^0.44.0",
    "@opentelemetry/exporter-zipkin": "^1.19.0",
    "@opentelemetry/api": "^1.8.0",
    "@opentelemetry/sdk-trace-node": "^0.50.0",
    "prom-client": "^15.0.0"
  }
}
```

**Instalación:**
```bash
cd servidor-empleados
npm install
cd ../servidor-auth
npm install
cd ../servidor-gateway
npm install
```

**Versiones mínimas verificadas:**
- Node.js: 16+
- npm: 8+

---

## Python (servidor-departamentos)

**Agregar a `requirements.txt`:**

```
opentelemetry-api==1.21.0
opentelemetry-sdk==1.21.0
opentelemetry-exporter-zipkin==1.21.0
prometheus-client==0.19.0
prometheus-fastapi-instrumentator==7.0.0
opentelemetry-instrumentation-fastapi==0.42b0
opentelemetry-instrumentation-requests==0.42b0
opentelemetry-instrumentation-sqlalchemy==0.42b0
```

**Instalación:**
```bash
cd servidor-departamentos
pip install -r requirements.txt
```

**Versiones mínimas verificadas:**
- Python: 3.8+
- pip: 20+

---

## Go (servidor-perfiles)

**Agregar a `go.mod`:**

```bash
cd servidor-perfiles
go get -u go.opentelemetry.io/otel
go get -u go.opentelemetry.io/otel/sdk
go get -u go.opentelemetry.io/otel/exporters/zipkin
go get -u github.com/prometheus/client_golang
```

**Versiones mínimas en go.mod:**

```
require (
    go.opentelemetry.io/otel v1.21.0
    go.opentelemetry.io/otel/sdk v1.21.0
    go.opentelemetry.io/otel/exporters/zipkin v1.21.0
    github.com/prometheus/client_golang v1.17.0
)
```

**Versiones mínimas verificadas:**
- Go: 1.18+

---

## Java (servidor-notificaciones)

**Agregar a `pom.xml`:**

```xml
<!-- Spring Boot Actuator (incluye Prometheus) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>

<!-- Micrometer Prometheus Registry -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>

<!-- OpenTelemetry Spring Boot Starter -->
<dependency>
    <groupId>io.opentelemetry.instrumentation</groupId>
    <artifactId>opentelemetry-spring-boot-starter</artifactId>
    <version>1.31.0-alpha</version>
</dependency>

<!-- OpenTelemetry Exporter Zipkin -->
<dependency>
    <groupId>io.opentelemetry.exporter</groupId>
    <artifactId>opentelemetry-exporter-zipkin</artifactId>
    <version>1.31.0</version>
</dependency>
```

**Versiones mínimas verificadas:**
- Java: 11+
- Maven: 3.6+
- Spring Boot: 2.7+

---

## Scripts de Instalación Rápida

Si quieres instalar todas las dependencias de una vez:

### Para todos los servicios Node.js:

```bash
#!/bin/bash
for dir in servidor-empleados servidor-auth servidor-gateway; do
  echo "Instalando dependencias en $dir..."
  cd "$dir"
  npm install
  cd ..
done
echo "✓ Dependencias Node.js instaladas"
```

### Para servidor Python:

```bash
cd servidor-departamentos
pip install -r requirements.txt
echo "✓ Dependencias Python instaladas"
```

### Para servidor Go:

```bash
cd servidor-perfiles
go mod download
echo "✓ Dependencias Go descargadas"
```

### Para servidor Java:

```bash
cd servidor-notificaciones
mvn dependency:resolve
echo "✓ Dependencias Java resueltas"
```

---

## Verificación de Instalación

Una vez instaladas las dependencias, verificar que los módulos están disponibles:

### Node.js:
```bash
node -e "require('@opentelemetry/sdk-node'); console.log('OpenTelemetry OK')"
node -e "require('prom-client'); console.log('Prometheus OK')"
```

### Python:
```bash
python -c "import opentelemetry; print('OpenTelemetry OK')"
python -c "from prometheus_client import Counter; print('Prometheus OK')"
```

### Go:
```bash
go list go.opentelemetry.io/otel
go list github.com/prometheus/client_golang
```

### Java:
```bash
mvn dependency:list | grep opentelemetry
mvn dependency:list | grep prometheus
```

---

## Troubleshooting

### Node.js

**Error:** `Cannot find module '@opentelemetry/sdk-node'`

**Solución:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Python

**Error:** `ModuleNotFoundError: No module named 'opentelemetry'`

**Solución:**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Go

**Error:** `go: no module requirements found in go.mod`

**Solución:**
```bash
go mod init microservicios
go get -u ./...
```

### Java

**Error:** `Could not find artifact io.opentelemetry...:...`

**Solución:**
```bash
mvn clean install -DskipTests
```

---

## Documentación de Referencia

- OpenTelemetry: https://opentelemetry.io/docs/
- Prometheus Clients: https://prometheus.io/docs/instrumenting/clientlibs/
- Zipkin Exporters: https://zipkin.io/
