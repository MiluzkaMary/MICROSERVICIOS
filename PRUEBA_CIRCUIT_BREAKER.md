# 🧪 Guía de Prueba: Circuit Breaker en Acción

## Prerrequisitos
1. Tener instalado: curl (o Postman)
2. Terminal PowerShell abierta
3. Servicios levantados

---

## 🚀 Paso 1: Levantar todos los servicios

```powershell
cd "c:\Users\Mary\Documents\9no Semestre\Microservicios\Reto1"
docker-compose down
docker-compose up --build
```

Espera a que veas:
```
departamentos-app  | Servidor corriendo en http://localhost:8081
empleados-app      | Servidor corriendo en http://localhost:8080
```

---

## ✅ Paso 2: Verificar que TODO funciona

### 2.1 Verificar servicio de departamentos
```powershell
curl http://localhost:8081/health
```
**Debe responder:** `{"status":"OK","service":"servidor-departamentos"}`

### 2.2 Verificar servicio de empleados
```powershell
curl http://localhost:8080/health
```
**Debe responder:** `{"status":"OK","service":"servidor-empleados"}`

### 2.3 Ver estado inicial del Circuit Breaker
```powershell
curl http://localhost:8080/circuit-breaker/status
```
**Debe responder algo como:**
```json
{
  "name": "departamentos-service-breaker",
  "state": "CLOSED",  ← ✅ CERRADO = TODO OK
  "stats": {
    "successes": 0,
    "failures": 0,
    "fallbacks": 0,
    "rejects": 0,
    "fires": 0
  }
}
```

---

## 📊 Paso 3: Crear un empleado (funcionamiento normal)

```powershell
curl -X POST http://localhost:8080/empleados -H "Content-Type: application/json" -d '{\"id\":\"E999\",\"nombre\":\"Maria\",\"email\":\"maria@test.com\",\"departamentoId\":\"1\",\"fechaIngreso\":\"2024-01-15\"}'
```

**Debe responder:** `201 Created` con los datos del empleado

### 3.1 Ver estadísticas después de crear
```powershell
curl http://localhost:8080/circuit-breaker/status
```
**Ahora verás:**
```json
{
  "state": "CLOSED",
  "stats": {
    "successes": 1,  ← ✅ 1 llamada exitosa
    "failures": 0,
    "fires": 1       ← 1 intento total
  }
}
```

---

## 💥 Paso 4: Simular que el servicio de departamentos FALLA

### 4.1 Detener SOLO el servicio de departamentos
```powershell
docker stop departamentos-app
```

### 4.2 Verificar que está caído
```powershell
curl http://localhost:8081/health
```
**Debe fallar:** `curl: (7) Failed to connect`

---

## 🔥 Paso 5: Ver el Circuit Breaker en acción

### 5.1 Intentar crear empleado (Primera vez - circuito cerrado)
```powershell
curl -X POST http://localhost:8080/empleados -H "Content-Type: application/json" -d '{\"id\":\"E001\",\"nombre\":\"Juan\",\"email\":\"juan1@test.com\",\"departamentoId\":\"1\",\"fechaIngreso\":\"2024-01-15\"}'
```
⏱️ **Observa:** Tarda ~3 segundos (timeout)
❌ **Responde:** `503 Service Unavailable`

### 5.2 Ejecutar múltiples peticiones en bucle
Usa este comando de PowerShell para ejecutar 5 peticiones automáticamente:

```powershell
1..5 | ForEach-Object {
    try {
        $body = @{
            id = "TEST$_"
            nombre = "Usuario Test"
            email = "test$_@ejemplo.com"
            departamentoId = "1"
            fechaIngreso = "2024-03-02"
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri "http://localhost:8080/empleados" -Method Post -ContentType "application/json" -Body $body -ErrorAction Stop | Out-Null
        Write-Host "Peticion $_ completada" -ForegroundColor Green
    } catch {
        Write-Host "Peticion $_ fallida" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 300
}
```

⏱️ **Observa:** Cada petición tarda ~3 segundos (timeout)

### 5.3 Ver estado del Circuit Breaker
```powershell
curl http://localhost:8080/circuit-breaker/status
```
**Debe mostrar:**
```json
{
  "state": "OPEN",  ← 🔴 ¡ABIERTO! Circuit Breaker activado
  "stats": {
    "successes": 1,   ← La primera del paso 3
    "failures": 5,    ← Las 5 que fallaron
    "fallbacks": 0,
    "rejects": 0,     ← Aún no ha rechazado ninguna
    "fires": 6
  }
}
```

---

## ⚡ Paso 6: Observar el CAMBIO (respuestas instantáneas)

### 6.1 Intentar crear empleado de nuevo
```powershell
curl -X POST http://localhost:8080/empleados -H "Content-Type: application/json" -d '{\"id\":\"E006\",\"nombre\":\"Sofia\",\"email\":\"sofia6@test.com\",\"departamentoId\":\"1\",\"fechaIngreso\":\"2024-01-15\"}'
```

⚡ **¡OBSERVA LA DIFERENCIA!**
- ⏱️ Responde en **milisegundos** (antes tardaba 3 segundos)
- ❌ Responde: `503` con mensaje "Circuit Breaker activado"
- 🛑 **NO intentó llamar** al servicio caído

### 6.2 Repetir varias veces
```powershell
curl -X POST http://localhost:8080/empleados -H "Content-Type: application/json" -d '{\"id\":\"E007\",\"nombre\":\"Test\",\"email\":\"test7@test.com\",\"departamentoId\":\"1\",\"fechaIngreso\":\"2024-01-15\"}'
```

**TODAS responden instantáneamente** (sin esperar timeout)

### 6.3 Ver estadísticas actualizadas
```powershell
curl http://localhost:8080/circuit-breaker/status
```
```json
{
  "state": "OPEN",
  "stats": {
    "successes": 1,
    "failures": 5,
    "fallbacks": 2,   ← Fallbacks ejecutados
    "rejects": 2,     ← Llamadas rechazadas (circuito abierto)
    "fires": 8        ← Total de intentos
  }
}
```

---

## 🔄 Paso 7: Recuperar el servicio

### 7.1 Volver a levantar departamentos
```powershell
docker start departamentos-app
```

Espera 3-5 segundos a que inicie completamente

### 7.2 Verificar que está funcionando
```powershell
curl http://localhost:8081/health
```
**Debe responder:** `{"status":"OK"}`

### 7.3 Esperar 10 segundos
El Circuit Breaker tiene configurado `resetTimeout: 10000` (10 segundos)
```powershell
# Espera 10 segundos...
```

### 7.4 Ver que pasa a HALF_OPEN
```powershell
curl http://localhost:8080/circuit-breaker/status
```
**Posiblemente veas:**
```json
{
  "state": "HALF_OPEN"  ← 🟡 Probando si el servicio se recuperó
}
```

### 7.5 Intentar crear un empleado
```powershell
curl -X POST http://localhost:8080/empleados -H "Content-Type: application/json" -d '{\"id\":\"E100\",\"nombre\":\"Recuperado\",\"email\":\"recuperado@test.com\",\"departamentoId\":\"1\",\"fechaIngreso\":\"2024-01-15\"}'
```

✅ **Debe funcionar:** `201 Created`

### 7.6 Verificar que el circuito se cerró
```powershell
curl http://localhost:8080/circuit-breaker/status
```
```json
{
  "state": "CLOSED",  ← 🟢 ¡Circuito cerrado! Todo vuelve a la normalidad
  "stats": {
    "successes": 2,   ← La del paso 3 + esta nueva
    "failures": 5,
    "fallbacks": 2,
    "rejects": 2,
    "fires": 9
  }
}
```

---

## 📊 Resumen Visual

```
ESTADO DEL CIRCUIT BREAKER:

Paso 1-3: 🟢 CLOSED (cerrado - normal)
          └─ Servicio funciona
          └─ Todas las llamadas pasan
          └─ Stats: 1 success

Paso 4-5: 💥 Servicio caído
          └─ 5 llamadas fallan (tardan 3s cada una)
          
Paso 5.3: 🔴 OPEN (abierto - protección)
          └─ Demasiados fallos detectados (5 de 5)
          └─ Circuito se abre automáticamente

Paso 6:   ⚡ Nuevas llamadas
          └─ Son RECHAZADAS instantáneamente
          └─ NO se intenta llamar al servicio caído
          └─ Stats: +2 rejects, +2 fallbacks

Paso 7:   🔄 Servicio se recupera
  +10s    └─ Circuit Breaker espera 10s
          
          🟡 HALF_OPEN (medio abierto - probando)
          └─ Permite 1 llamada de prueba
          
          ✅ Llamada de prueba exitosa
          
          🟢 CLOSED (cerrado - recuperado)
          └─ Todo vuelve a la normalidad
```

---

## 🎯 Compara el ANTES y DESPUÉS

### Sin Circuit Breaker (antes):
```
Servicio caído → 10 usuarios intentan crear empleado
cada uno espera: 3 segundos (timeout)
Total: 10 × 3s = 30 segundos de tiempo perdido
Servidor empleados: 10 conexiones bloqueadas
```

### Con Circuit Breaker (ahora):
```
Servicio caído → 10 usuarios intentan crear empleado
Primeros 5: esperan 3s cada uno (hasta que se abre el circuito)
Siguientes 5: respuesta instantánea (<1ms)
Total: 5 × 3s + 5 × 0.001s = 15 segundos ahorrados
Servidor empleados: NO se bloquea
```

---

## 📝 Logs a observar

Durante las pruebas, en la terminal de docker-compose verás:

```
empleados-app  | ✅ Circuit Breaker - Llamada exitosa
empleados-app  | ❌ Circuit Breaker - Llamada fallida: Timeout después de 3000ms
empleados-app  | ❌ Circuit Breaker - Llamada fallida: Timeout después de 3000ms
empleados-app  | 🔴 CIRCUIT BREAKER ABIERTO - Demasiados fallos detectados
empleados-app  | 🚫 Circuit Breaker - Llamada rechazada (circuito abierto)
empleados-app  | ⚠️ Circuit Breaker - Fallback ejecutado
empleados-app  | 🟡 CIRCUIT BREAKER HALF-OPEN - Probando recuperación del servicio
empleados-app  | ✅ Circuit Breaker - Llamada exitosa
empleados-app  | 🟢 CIRCUIT BREAKER CERRADO - Servicio recuperado
```

