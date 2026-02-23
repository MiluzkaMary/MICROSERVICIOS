# Resumen de Cambios - Mejores Prácticas en Microservicios

## 📋 Cambios Realizados

### 1. ✅ Eliminación de docker-compose.yml Duplicados

**Archivos ELIMINADOS:**
- ❌ `servidor-empleados/docker-compose.yml`
- ❌ `servidor-departamentos/docker-compose.yml`

**Razón:**
En arquitectura de microservicios con orquestación centralizada, tener múltiples archivos `docker-compose.yml` es una **mala práctica** porque:
- Genera confusión sobre cuál usar
- Puede causar configuraciones inconsistentes
- Dificulta el mantenimiento
- No es necesario cuando el compose de la raíz ya apunta a cada servicio

**Buena Práctica:**
✅ Mantener un solo `docker-compose.yml` en la raíz del proyecto que orqueste todos los microservicios.

---

### 2. ✅ Implementación de Comunicación HTTP Entre Servicios

**Archivo CREADO:**
- ✅ `servidor-empleados/src/utils/httpClient.js`

**Características implementadas:**
- ⏱️ **Timeout configurable**: 3 segundos por petición
- 🔁 **Reintentos automáticos**: 2 reintentos con delay de 500ms
- 🛡️ **Manejo de errores robusto**: Timeout, errores de red, códigos HTTP
- 📊 **Logging**: Registro de intentos y errores
- 🚀 **Sin dependencias externas**: Usa solo módulos nativos de Node.js (`http`)

**Código de ejemplo:**
```javascript
const { httpGet } = require('../utils/httpClient');

const response = await httpGet(url, {
  timeout: 3000,
  retries: 2,
  retryDelay: 500
});
```

---

### 3. ✅ Actualización de empleadoService.js

**Archivo MODIFICADO:**
- `servidor-empleados/src/services/empleadoService.js`

**Flujo implementado:**
```
POST /empleados → Validación local → GET /departamentos/{id} → Guardar empleado
```

**Casos de uso manejados:**

| Escenario | Código | Respuesta |
|-----------|--------|-----------|
| Departamento existe | 201/200 | 201 Created - Empleado creado |
| Departamento no existe | 404 | 400 Bad Request - "departamento no existe" |
| Servicio caído/timeout | Timeout | 503 Service Unavailable - "servicio no disponible" |
| Error en validación | Otro error | 502 Bad Gateway - "error validando departamento" |

**Ejemplo de código:**
```javascript
// Validar departamento antes de crear empleado
const departamentoUrl = `http://${host}:${port}/departamentos/${empleado.departamentoId}`;

try {
  const response = await httpGet(departamentoUrl, {
    timeout: 3000,
    retries: 2
  });
  
  if (response.statusCode === 404) {
    return { statusCode: 400, message: "departamento no existe" };
  }
  
  // Continuar con creación...
} catch (error) {
  // Servicio caído o timeout
  return { statusCode: 503, message: "servicio no disponible" };
}
```

---

### 4. ✅ Actualización de docker-compose.yml

**Archivo MODIFICADO:**
- `docker-compose.yml` (raíz)

**Cambios:**

1. **Variables de entorno agregadas:**
```yaml
environment:
  - DEPARTAMENTOS_SERVICE_HOST=departamentos-service
  - DEPARTAMENTOS_SERVICE_PORT=8081
```

2. **Dependencia de servicios:**
```yaml
depends_on:
  database-empleados:
    condition: service_healthy
  departamentos-service:
    condition: service_started
```

Esto asegura que:
- La BD de empleados esté lista antes de iniciar el servicio
- El servicio de departamentos esté iniciado (para validación)

---

### 5. ✅ Datos de Prueba en Base de Datos

**Archivo MODIFICADO:**
- `servidor-departamentos/init.sql`

**Agregado:**
```sql
INSERT INTO departamentos (nombre, descripcion) VALUES
    ('Tecnología', 'Departamento de desarrollo de software e infraestructura'),
    ('Recursos Humanos', 'Gestión de personal y nómina'),
    ('Ventas', 'Equipo comercial y relaciones con clientes'),
    ('Marketing', 'Estrategia de marca y comunicación'),
    ('Finanzas', 'Contabilidad y control financiero')
ON CONFLICT (nombre) DO NOTHING;
```

**Razón:**
Facilita las pruebas inmediatas sin necesidad de crear departamentos manualmente.

---

### 6. ✅ Documentación Actualizada

**Archivos MODIFICADOS:**
- `README.md` (raíz)
- `COMANDOS.md` (raíz)
- `servidor-empleados/README.md`

**Secciones agregadas:**
- 🔄 Comunicación entre servicios
- 🧪 Escenarios de prueba (éxito, error 404, servicio caído)
- 📊 Variables de entorno
- ⚙️ Configuración de timeout y reintentos

---

## 🎯 Mejores Prácticas Implementadas

### 1. Docker Compose Único ✅
- **Un solo archivo** en la raíz
- Orquesta todos los servicios
- Evita duplicación y confusión

### 2. Comunicación HTTP Resiliente ✅
- **Timeout corto** (3 segundos) - No bloquear indefinidamente
- **Reintentos automáticos** (2 intentos) - Tolerar fallos transitorios
- **Delay entre reintentos** (500ms) - Dar tiempo al servicio a recuperarse
- **Manejo de errores** - Respuestas JSON consistentes

### 3. Circuit Breaker Básico ✅
- Si el servicio no responde después de reintentos → Falla rápido (503)
- No acumula requests mientras el servicio está caído
- Protege recursos del sistema

### 4. Separación de Responsabilidades ✅
- **httpClient.js** - Lógica de comunicación HTTP
- **empleadoService.js** - Lógica de negocio
- Código reutilizable y testeable

### 5. Logging Apropiado ✅
```javascript
console.log(`Validando departamento ${id} en ${url}`);
console.log(`Reintento ${attempt}/${retries} para ${url}`);
console.error('Error comunicándose con servicio:', error.message);
```

### 6. Códigos HTTP Semánticos ✅
- 201 Created - Recurso creado exitosamente
- 400 Bad Request - Datos inválidos (departamento no existe)
- 502 Bad Gateway - Error en servicio externo
- 503 Service Unavailable - Servicio no disponible

### 7. Variables de Entorno ✅
- Configuración externalizada
- Fácil cambio sin modificar código
- Diferentes valores en dev/prod

---

## 🚀 Cómo Usar

### Levantar Infraestructura Completa

```powershell
cd "c:\Users\Mary\Documents\9no Semestre\Microservicios\Reto1"
docker-compose up --build
```

### Probar Comunicación Entre Servicios

**Caso 1: Departamento válido (✅ 201)**
```powershell
curl -X POST http://localhost:8080/empleados `
  -H "Content-Type: application/json" `
  -d '{\"id\":\"E001\",\"nombre\":\"Juan\",\"email\":\"juan@test.com\",\"departamentoId\":\"1\",\"fechaIngreso\":\"2024-01-01\"}'
```

**Caso 2: Departamento inexistente (❌ 400)**
```powershell
curl -X POST http://localhost:8080/empleados `
  -H "Content-Type: application/json" `
  -d '{\"id\":\"E002\",\"nombre\":\"Ana\",\"email\":\"ana@test.com\",\"departamentoId\":\"999\",\"fechaIngreso\":\"2024-01-01\"}'
```

**Caso 3: Servicio caído (❌ 503)**
```powershell
# Detener servicio de departamentos
docker stop departamentos-app

# Intentar crear empleado (fallará con 503)
curl -X POST http://localhost:8080/empleados `
  -H "Content-Type: application/json" `
  -d '{\"id\":\"E003\",\"nombre\":\"Luis\",\"email\":\"luis@test.com\",\"departamentoId\":\"1\",\"fechaIngreso\":\"2024-01-01\"}'

# Restaurar servicio
docker start departamentos-app
```

---

## 📊 Comparación: Antes vs Después

| Aspecto | ❌ Antes | ✅ Después |
|---------|---------|-----------|
| Docker Compose | 3 archivos (raíz + 2 servicios) | 1 archivo (solo raíz) |
| Comunicación HTTP | Básica con fetch (no instalado) | Cliente HTTP robusto con reintentos |
| Timeout | Indefinido | 3 segundos |
| Reintentos | No | 2 reintentos con delay |
| Manejo errores servicio caído | Error genérico 500 | 503 Service Unavailable específico |
| Logging | Mínimo | Completo (intentos, errores, validaciones) |
| Códigos HTTP | Inconsistentes | Semánticos y documentados |
| Datos de prueba | Manual | Precargados en BD |
| Documentación | Básica | Completa con escenarios de prueba |

---

## 🎓 Conceptos de Microservicios Aplicados

1. ✅ **Independencia de datos** - Cada servicio con su BD
2. ✅ **Desacoplamiento** - Servicios independientes
3. ✅ **Comunicación HTTP** - API REST entre servicios
4. ✅ **Resiliencia** - Timeout, reintentos, manejo de fallos
5. ✅ **Escalabilidad** - Servicios pueden escalar independientemente
6. ✅ **Orquestación** - Docker Compose centralizado
7. ✅ **Observabilidad** - Logging de comunicaciones
8. ✅ **Tolerancia a fallos** - Circuit breaker básico

---

## ✅ Checklist de Verificación

- [x] Docker compose único en la raíz
- [x] Eliminados docker-compose.yml duplicados
- [x] httpClient.js con timeout y reintentos
- [x] Comunicación entre servicios implementada
- [x] Manejo de errores (404, timeout, errores de red)
- [x] Variables de entorno configuradas
- [x] Dependencias de servicios en compose
- [x] Datos de prueba precargados
- [x] Documentación completa
- [x] Ejemplos de uso para cada escenario
- [x] Códigos HTTP semánticos
- [x] Logging apropiado

---

## 📖 Referencias

- **Timeout**: Evita que requests cuelguen indefinidamente
- **Reintentos**: Tolera fallos transitorios de red
- **Circuit Breaker**: Protege sistema cuando servicio está caído
- **Service Discovery**: Usa nombres de contenedores (departamentos-service)
- **Health Checks**: Valida que servicios estén listos antes de depender de ellos
