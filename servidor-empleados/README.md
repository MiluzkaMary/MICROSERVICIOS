# servidor-empleados

## Descripcion del servicio
Servicio de ciclo de vida de empleados. Implementa operaciones CRUD, validacion de departamento y publicacion de eventos.

## Responsabilidad dentro del sistema
- Crear, consultar, actualizar y eliminar empleados.
- Validar existencia de departamento via HTTP en servidor-departamentos.
- Proteger esa llamada con circuit breaker.
- Publicar eventos de dominio para auth, perfiles y notificaciones.

## Endpoints reales
- POST /empleados
- GET /empleados
- GET /empleados/:id
- PUT /empleados/:id
- DELETE /empleados/:id
- GET /circuit-breaker/status
- GET /health
- GET /api-docs
- GET /api-docs.json

## Base de datos
- Motor: PostgreSQL
- Base: empleados_db
- Tabla principal: empleados

Campos relevantes:
- id
- nombre
- email
- departamento_id
- fecha_ingreso

## Eventos RabbitMQ

Exchange: empleados_events

Publica:
- empleado.creado
- empleado.eliminado

Consume:
- No consume eventos RabbitMQ

## Participacion en el flujo general
- Es el origen de eventos de alta/baja de empleado.
- En alta valida departamento antes de persistir.
- En baja publica evento para sincronizar auth, perfiles y notificaciones.
