# Circuit Breaker

## Donde esta implementado

- Servicio: servidor-empleados
- Archivo principal: src/utils/circuitBreakerClient.js
- Endpoint de estado: GET /circuit-breaker/status

## Que protege

Protege la llamada HTTP de servidor-empleados hacia servidor-departamentos durante la validacion de departamento en alta de empleado.

La llamada protegida se ejecuta desde:
- src/services/empleadoService.js
- Funcion: crearEmpleado

## Configuracion real

Configuracion definida en circuitBreakerOptions:
- timeout: 3000 ms
- errorThresholdPercentage: 50
- resetTimeout: 10000 ms
- rollingCountTimeout: 10000 ms
- rollingCountBuckets: 10
- volumeThreshold: 3
- name: departamentos-service-breaker

## Estados

CLOSED
- Operacion normal.
- Las llamadas pasan al servicio de departamentos.

OPEN
- Se alcanza el umbral de error y el circuito se abre.
- Las llamadas se rechazan y entra fallback con respuesta 503.

HALF_OPEN
- Despues de resetTimeout, el circuito permite llamadas de prueba.
- Si la prueba funciona, vuelve a CLOSED.
- Si falla, vuelve a OPEN.

## Fallback implementado

Cuando el circuito esta abierto, el fallback retorna:
- statusCode: 503
- circuitBreakerOpen: true
- message: Servicio temporalmente no disponible. Circuit Breaker activado.

## Como probarlo

1. Levantar entorno:

```bash
docker-compose up --build
```

2. Verificar estado inicial:

```bash
curl http://localhost:8080/circuit-breaker/status
```

3. Detener servidor-departamentos para forzar fallos:

```bash
docker stop departamentos-app
```

4. Intentar crear empleados varias veces (dispara validacion de departamento).

5. Consultar nuevamente estado del circuito:

```bash
curl http://localhost:8080/circuit-breaker/status
```

6. Volver a levantar departamentos y esperar el resetTimeout para observar HALF_OPEN/CLOSED:

```bash
docker start departamentos-app
```

## Metricas expuestas

El endpoint GET /circuit-breaker/status incluye:
- state
- stats.successes
- stats.failures
- stats.fallbacks
- stats.timeouts
- stats.rejects
- stats.fires
- config.timeout
- config.errorThresholdPercentage
- config.resetTimeout
- config.volumeThreshold