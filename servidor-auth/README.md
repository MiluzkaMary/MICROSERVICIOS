# servidor-auth

## Descripcion del servicio
Servicio de autenticacion del sistema. Gestiona credenciales, login y ciclos de activacion/recuperacion de password.

## Responsabilidad dentro del sistema
- Emitir JWT para acceso a microservicios.
- Provisionar usuarios al consumir eventos de empleados.
- Desactivar usuarios cuando un empleado es eliminado.
- Publicar eventos para notificaciones de activacion y recuperacion.

## Endpoints reales
- POST /auth/login
- POST /auth/recover-password
- POST /auth/reset-password
- GET /health
- GET /api-docs
- GET /api-docs.json

## Base de datos
- Motor: PostgreSQL
- Base: auth_db
- Tabla principal: usuarios

Campos relevantes:
- empleado_id
- email
- password_hash
- role
- activo
- token_recuperacion
- token_expiracion

Seed:
- Usuario admin inicial: ADMIN / admin@empresa.com
- Insercion idempotente con ON CONFLICT DO NOTHING

## Eventos RabbitMQ

Exchange: empleados_events

Consume:
- empleado.creado (cola auth.empleado_creado)
- empleado.eliminado (cola auth.empleado_eliminado)

Publica:
- usuario.creado
- usuario.recuperacion

## Participacion en el flujo general
- En alta de empleado: crea usuario USER sin password, genera token y publica usuario.creado.
- En eliminacion de empleado: marca usuario como inactivo.
- En recuperacion de password: genera token temporal y publica usuario.recuperacion.
