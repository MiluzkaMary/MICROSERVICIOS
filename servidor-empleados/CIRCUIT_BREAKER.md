# 🔌 Circuit Breaker - Patrón de Resiliencia

## ¿Qué es un Circuit Breaker?

El **Circuit Breaker** es un patrón de diseño que previene fallos en cascada en sistemas distribuidos. Funciona como un "fusible eléctrico" que:

1. **Detecta fallos repetidos** en servicios externos
2. **Abre el circuito** temporalmente cuando hay demasiados errores
3. **Evita llamadas innecesarias** a servicios caídos
4. **Permite recuperación automática** cuando el servicio vuelve

---

## ⚙️ Estados del Circuit Breaker

### 🟢 **CLOSED** (Cerrado - Normal)
- El circuito funciona normalmente
- Todas las llamadas se intentan
- Se monitorean los fallos

### 🔴 **OPEN** (Abierto - Protección Activa)
- Demasiados fallos detectados (>50% en últimos 10 segundos)
- **Las llamadas se rechazan inmediatamente**
- Se devuelve respuesta de fallback (sin esperar)
- Ahorra recursos y tiempo

### 🟡 **HALF_OPEN** (Medio Abierto - Probando)
- Después de 10 segundos en OPEN, prueba si el servicio se recuperó
- Intenta una llamada de prueba
- Si funciona → vuelve a CLOSED ✅
- Si falla → vuelve a OPEN ❌

---

## 📊 Configuración Actual

```javascript
{
  timeout: 3000,                    // Timeout de 3 segundos por llamada
  errorThresholdPercentage: 50,     // Abre el circuito si >50% de llamadas fallan
  resetTimeout: 10000,              // Intenta cerrar el circuito cada 10 segundos
  volumeThreshold: 5,               // Mínimo 5 llamadas antes de evaluar
  rollingCountTimeout: 10000        // Ventana de evaluación: 10 segundos
}
```

---

## 🎯 Beneficios de Implementación

### 1. **Previene Fallos en Cascada**
```
Sin Circuit Breaker:
  Servicio Departamentos CAÍDO 
    ↓
  Empleados espera 3s × intento × 3 reintentos = 9s por request
    ↓
  Todas las peticiones a Empleados se enlentecen
    ↓
  Sistema completo se colapsa 💥

Con Circuit Breaker:
  Servicio Departamentos CAÍDO
    ↓
  Circuit Breaker se ABRE después de 5 fallos
    ↓
  Nuevas peticiones reciben respuesta inmediata de fallback
    ↓
  Sistema sigue funcionando (con degradación controlada) ✅
```

### 2. **Reduce Carga sobre Servicios Fallidos**
- No bombardea un servicio que ya está caído
- Permite que el servicio se recupere sin presión adicional

### 3. **Respuestas Rápidas al Usuario**
- Sin Circuit Breaker: esperar timeout → reintentos → error (9+ segundos)
- Con Circuit Breaker: respuesta inmediata cuando está OPEN (<1ms)

### 4. **Recuperación Automática**
- Prueba automáticamente cada 10 segundos
- Se recupera solo cuando el servicio vuelve

---

## 🚀 Uso en el Proyecto

### Implementado en:
- **Servicio**: `servidor-empleados`
- **Protege**: Llamadas al servicio de `departamentos`
- **Ubicación**: `src/utils/circuitBreakerClient.js`

### Usado en:
- `empleadoService.crearEmpleado()` - Valida que el departamento existe antes de crear un empleado

---

## 📡 Monitoreo

### Ver estado del Circuit Breaker:

```powershell
curl http://localhost:8080/circuit-breaker/status
```

**Respuesta ejemplo (estado CLOSED - normal):**
```json
{
  "name": "departamentos-service-breaker",
  "state": "CLOSED",
  "stats": {
    "successes": 15,
    "failures": 1,
    "fallbacks": 0,
    "timeouts": 0,
    "rejects": 0,
    "fires": 16,
    "latencyMean": 145
  },
  "config": {
    "timeout": 3000,
    "errorThresholdPercentage": 50,
    "resetTimeout": 10000,
    "volumeThreshold": 5
  }
}
```

**Respuesta ejemplo (estado OPEN - circuito abierto):**
```json
{
  "name": "departamentos-service-breaker",
  "state": "OPEN",
  "stats": {
    "successes": 3,
    "failures": 12,
    "fallbacks": 8,
    "timeouts": 5,
    "rejects": 15,
    "fires": 38,
    "latencyMean": 2987
  }
}
```

### Interpretación de Estadísticas:

- **successes**: Llamadas exitosas ✅
- **failures**: Llamadas fallidas ❌
- **fallbacks**: Veces que se ejecutó la respuesta alternativa
- **timeouts**: Llamadas que excedieron el timeout (3s)
- **rejects**: Llamadas rechazadas porque el circuito está OPEN
- **fires**: Total de intentos de llamada
- **latencyMean**: Latencia promedio en milisegundos

---

## 🧪 Pruebas de Resiliencia

### Escenario 1: Servicio de Departamentos Funcional
1. Levantar todos los servicios:
   ```powershell
   docker-compose up -d
   ```

2. Crear un empleado (debe funcionar):
   ```powershell
   curl -X POST http://localhost:8080/empleados -H "Content-Type: application/json" -d '{\"id\":\"E001\",\"nombre\":\"Juan\",\"email\":\"juan@test.com\",\"departamentoId\":\"1\",\"fechaIngreso\":\"2024-01-15\"}'
   ```

3. Ver estado del Circuit Breaker:
   ```powershell
   curl http://localhost:8080/circuit-breaker/status
   ```
   - **Estado esperado**: `CLOSED`
   - **Successes**: > 0

---

### Escenario 2: Servicio de Departamentos Caído

1. Detener solo el servicio de departamentos:
   ```powershell
   docker stop departamentos-app
   ```

2. Intentar crear varios empleados (5-6 veces rápidamente):
   ```powershell
   curl -X POST http://localhost:8080/empleados -H "Content-Type: application/json" -d '{\"id\":\"E002\",\"nombre\":\"Ana\",\"email\":\"ana@test.com\",\"departamentoId\":\"1\",\"fechaIngreso\":\"2024-01-15\"}'
   ```

3. Ver el estado del Circuit Breaker:
   ```powershell
   curl http://localhost:8080/circuit-breaker/status
   ```
   - **Estado esperado**: `OPEN` (después de 5+ fallos)
   - **Failures**: > 5
   - **Rejects**: > 0 (llamadas posteriores rechazadas)

4. **Observar**:
   - Primeras 5 llamadas tardan ~3 segundos cada una (timeout + reintentos)
   - Siguientes llamadas son **instantáneas** (circuito abierto, respuesta inmediata)

5. Esperar 10 segundos y volver a llamar:
   - El circuito pasa a `HALF_OPEN`
   - Intenta una llamada de prueba
   - Como el servicio sigue caído, vuelve a `OPEN`

---

### Escenario 3: Recuperación del Servicio

1. Con el circuito en `OPEN`, volver a levantar departamentos:
   ```powershell
   docker start departamentos-app
   ```

2. Esperar 10 segundos (resetTimeout)

3. El Circuit Breaker automáticamente:
   - Pasa a `HALF_OPEN`
   - Intenta una llamada de prueba
   - Si funciona, vuelve a `CLOSED` ✅

4. Verificar:
   ```powershell
   curl http://localhost:8080/circuit-breaker/status
   ```
   - **Estado esperado**: `CLOSED` (circuito recuperado)

---

## 📈 Logs del Circuit Breaker

Los siguientes eventos se registran automáticamente:

```
🔴 CIRCUIT BREAKER ABIERTO - Demasiados fallos detectados
🟢 CIRCUIT BREAKER CERRADO - Servicio recuperado
🟡 CIRCUIT BREAKER HALF-OPEN - Probando recuperación del servicio
✅ Circuit Breaker - Llamada exitosa
❌ Circuit Breaker - Llamada fallida: Error de red
⚠️ Circuit Breaker - Fallback ejecutado
⏱️ Circuit Breaker - Timeout detectado
🚫 Circuit Breaker - Llamada rechazada (circuito abierto)
```

---

## 🎓 Conceptos Clave

### ¿Por qué es peligroso NO tener Circuit Breaker?

**Sin Circuit Breaker:**
```
Usuario → Empleados → [espera 3s timeout] → [reintento 1: 3s] → [reintento 2: 3s] 
         = 9 segundos para recibir un error
         × 100 usuarios = 100 conexiones bloqueadas × 9s
         → Colapso del servicio 💥
```

**Con Circuit Breaker:**
```
Usuario → Empleados → Circuit Breaker OPEN → Respuesta inmediata (<1ms)
         = Respuesta instantánea con mensaje claro
         × 100 usuarios = 100 respuestas rápidas
         → Sistema estable ✅
```

### ¿Cuándo se usa?

✅ **Usar Circuit Breaker cuando:**
- Llamas a servicios externos (APIs, microservicios)
- El servicio puede fallar o ser lento
- Necesitas resiliencia y degradación controlada
- Quieres proteger tu sistema de fallos en cascada

❌ **NO necesario para:**
- Llamadas a base de datos local (ya tiene pool de conexiones)
- Operaciones internas síncronas
- Funciones que no pueden fallar

---

## 🔧 Configuración Avanzada

Si quieres ajustar el comportamiento, edita `src/utils/circuitBreakerClient.js`:

```javascript
const circuitBreakerOptions = {
  timeout: 5000,                    // Aumentar timeout a 5s
  errorThresholdPercentage: 30,     // Más sensible (abre con 30% errores)
  resetTimeout: 30000,              // Esperar 30s antes de reintentar
  volumeThreshold: 10,              // Necesitar 10 llamadas antes de evaluar
};
```

---

## 📚 Referencias

- **Opossum**: https://nodeshift.dev/opossum/
- **Pattern Circuit Breaker**: https://martinfowler.com/bliki/CircuitBreaker.html
- **Microservices Patterns**: https://microservices.io/patterns/reliability/circuit-breaker.html

---

✅ **Circuit Breaker implementado correctamente con Opossum**
