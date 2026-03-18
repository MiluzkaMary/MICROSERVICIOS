# servidor-perfiles

## Descripcion del servicio
Servicio de perfiles de empleado para informacion complementaria.

## Responsabilidad dentro del sistema
- Crear perfil por defecto cuando se crea empleado.
- Eliminar perfil cuando se elimina empleado.
- Permitir consulta y actualizacion de perfil.

## Endpoints reales
- GET /perfiles
- GET /perfiles/:empleadoId
- PUT /perfiles/:empleadoId
- POST /perfiles/evento/empleado-creado (interno)
- GET /health
- GET /api-docs
- GET /api-docs.json

## Base de datos
- Motor: PostgreSQL
- Base: perfiles_db
- Tabla principal: perfiles

Campos relevantes:
- empleado_id
- nombre
- email
- telefono
- direccion
- ciudad
- biografia

## Eventos RabbitMQ

Exchange: empleados_events

Consume:
- empleado.creado (cola perfiles.empleado_creado)
- empleado.eliminado (cola perfiles.empleado_eliminado)

Publica:
- No publica eventos

## Participacion en el flujo general
- Sincroniza el perfil con el estado del empleado consumiendo eventos de alta y baja.
