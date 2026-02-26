# 🐰 RabbitMQ - Guía de Referencia Rápida

## 📋 Resumen

RabbitMQ está implementado como message broker para comunicación asíncrona entre microservicios.

---

## 🔧 Configuración

### Servicios Conectados

| Servicio | Rol | Exchange | Colas |
|----------|-----|----------|-------|
| **Empleados** | Publisher | `empleados_events` | - |
| **Perfiles** | Consumer | `empleados_events` | `perfiles.empleado_creado` |
| **Notificaciones** | Consumer | `empleados_events` | `notificaciones.empleado_creado`<br>`notificaciones.empleado_eliminado` |

### Acceso

- **Manager UI**: http://localhost:15672
- **Usuario**: guest
- **Contraseña**: guest
- **Puerto AMQP**: 5672

---

## 📨 Eventos Implementados

### 1. `empleado.creado`

**Publisher**: Servicio Empleados  
**Trigger**: `POST /empleados` exitoso  

**Payload:**
```json
{
  "empleadoId": "EMP001",
  "nombre": "Juan Pérez",
  "email": "juan@empresa.com",
  "departamentoId": "1",
  "fechaIngreso": "2024-01-15",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Consumers:**
- **Perfiles**: Crea perfil default
- **Notificaciones**: Envía email de bienvenida

---

### 2. `empleado.eliminado`

**Publisher**: Servicio Empleados  
**Trigger**: `DELETE /empleados/{id}` exitoso  

**Payload:**
```json
{
  "empleadoId": "EMP001",
  "nombre": "Juan Pérez",
  "email": "juan@empresa.com",
  "timestamp": "2024-01-15T15:45:00.000Z"
}
```

**Consumers:**
- **Notificaciones**: Envía email de desvinculación

---

## 🧪 Pruebas

### Prueba 1: Flujo Normal

```bash
# 1. Crear empleado
curl -X POST http://localhost:8080/empleados \
  -H "Content-Type: application/json" \
  -d '{
    "id": "EMP999",
    "nombre": "Juan Pérez",
    "email": "juan@empresa.com",
    "departamentoId": "1",
    "fechaIngreso": "2024-01-15"
  }'

# 2. Verificar perfil creado
curl http://localhost:8082/perfiles/EMP999

# 3. Ver email en Mailhog
# Abrir: http://localhost:8025

# 4. Ver notificación en DB
curl http://localhost:8083/notificaciones/EMP999
```

### Prueba 2: Resiliencia (Servicio Caído)

```bash
# 1. Detener servicio de perfiles
docker stop perfiles-app

# 2. Crear empleado (debe funcionar igual)
curl -X POST http://localhost:8080/empleados \
  -H "Content-Type: application/json" \
  -d '{
    "id": "EMP998",
    "nombre": "Ana García",
    "email": "ana@empresa.com",
    "departamentoId": "1",
    "fechaIngreso": "2024-01-16"
  }'

# 3. Verificar evento en cola de RabbitMQ
# Abrir: http://localhost:15672/#/queues
# Ver cola: perfiles.empleado_creado (1 mensaje pendiente)

# 4. Reiniciar servicio de perfiles
docker start perfiles-app

# 5. Esperar 5 segundos y verificar perfil creado
sleep 5
curl http://localhost:8082/perfiles/EMP998
# ✅ Perfil creado automáticamente
```

### Prueba 3: Eliminar Empleado

```bash
# 1. Eliminar empleado
curl -X DELETE http://localhost:8080/empleados/EMP999

# 2. Ver logs del servicio de notificaciones
docker logs notificaciones-app --tail 10

# Debe mostrar:
# [NOTIFICACIÓN] Tipo: DESVINCULACIÓN | Para: juan@empresa.com | ...

# 3. Ver email en Mailhog
# http://localhost:8025 - Email de desvinculación
```

---

## 📊 Monitoreo en RabbitMQ Manager UI

### Ver Exchange

1. Abrir http://localhost:15672
2. Login: guest/guest
3. Ir a **Exchanges**
4. Buscar: `empleados_events`
5. Ver bindings y routing keys

### Ver Colas

1. Ir a **Queues**
2. Colas activas:
   - `perfiles.empleado_creado`
   - `notificaciones.empleado_creado`
   - `notificaciones.empleado_eliminado`

3. Click en una cola para ver:
   - Messages ready (pendientes)
   - Messages unacknowledged (procesándose)
   - Message rates (msgs/seg)

### Ver Mensajes

1. Click en una cola
2. Ir a **Get Messages**
3. Click en **Get Message(s)**
4. Ver payload del mensaje

---

## 🔍 Troubleshooting

### Problema: Mensajes no se consumen

**Verificar:**
```bash
# 1. Ver si el consumidor está conectado
# RabbitMQ UI → Queues → Click en cola → Ver "Consumers"

# 2. Ver logs del servicio consumidor
docker logs perfiles-app --tail 20
docker logs notificaciones-app --tail 20

# Debe mostrar:
# ✅ Conectado a RabbitMQ
# 🎯 Escuchando eventos: empleado.creado
```

**Solución:**
```bash
# Reiniciar servicio consumidor
docker restart perfiles-app
docker restart notificaciones-app
```

---

### Problema: Exchange no existe

**Síntoma:**
```
Error: Channel closed by server: 404 (NOT-FOUND) with message "NOT_FOUND - no exchange 'empleados_events'"
```

**Solución:**
```bash
# El exchange lo crea el servicio de Empleados
# Reiniciar servicio de empleados primero
docker restart empleados-app

# Luego reiniciar consumidores
docker restart perfiles-app
docker restart notificaciones-app
```

---

### Problema: Mensajes en Dead Letter Queue

**Verificar:**
```bash
# Ver logs de errores en consumidores
docker logs perfiles-app | grep "❌"
docker logs notificaciones-app | grep "❌"
```

**Causas comunes:**
- Error en DB del consumidor
- Validación fallida
- Exception no manejada

---

## 🛠️ Comandos Útiles

### Ver estado de RabbitMQ
```bash
docker exec -it rabbitmq rabbitmq-diagnostics status
```

### Ver colas
```bash
docker exec -it rabbitmq rabbitmqctl list_queues
```

### Ver exchanges
```bash
docker exec -it rabbitmq rabbitmqctl list_exchanges
```

### Ver bindings
```bash
docker exec -it rabbitmq rabbitmqctl list_bindings
```

### Purgar una cola (borrar todos los mensajes)
```bash
docker exec -it rabbitmq rabbitmqctl purge_queue perfiles.empleado_creado
```

### Ver logs de RabbitMQ
```bash
docker logs rabbitmq --tail 50
```

---

## 📈 Métricas

### Rendimiento Esperado

| Métrica | Valor |
|---------|-------|
| **Latencia de publicación** | <5ms |
| **Latencia de consumo** | <10ms |
| **Throughput** | ~1K msgs/segundo |
| **Memory usage** | ~200MB |

### Monitoreo

**En RabbitMQ UI → Overview:**
- Message rates
- Queue depths
- Connection count
- Channel count

---

## 🔐 Seguridad

### Cambiar credenciales (Producción)

```yaml
# docker-compose.yml
rabbitmq:
  environment:
    RABBITMQ_DEFAULT_USER: admin
    RABBITMQ_DEFAULT_PASS: secure_password_here
```

**Actualizar en servicios:**
```yaml
empleados-service:
  environment:
    - RABBITMQ_USER=admin
    - RABBITMQ_PASSWORD=secure_password_here
```

---

## 📚 Referencias

- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [amqplib (Node.js client)](https://www.npmjs.com/package/amqplib)
- [MESSAGE_BROKER_RABBITMQ.md](MESSAGE_BROKER_RABBITMQ.md) - Justificación técnica detallada
