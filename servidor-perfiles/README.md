# servidor-perfiles

## Descripcion del servicio
Servicio de perfiles de empleado migrado a Go. Mantiene el contrato HTTP existente, valida JWT en las rutas expuestas por el gateway y sincroniza el estado de perfil con RabbitMQ.

## Responsabilidad dentro del sistema
- Crear perfil por defecto cuando se crea empleado.
- Desactivar perfil cuando se elimina empleado.
- Reactivar perfil cuando se reactiva empleado.
- Permitir consulta y actualizacion de perfil.

## Endpoints reales
- GET /perfiles
- GET /perfiles/:empleadoId
- PUT /perfiles/:empleadoId
- POST /perfiles/evento/empleado-creado
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
- activo

## Eventos RabbitMQ

Exchange: empleados_events

Consume:
- empleado.creado (cola perfiles.empleado_creado)
- empleado.eliminado (cola perfiles.empleado_eliminado)
- empleado.reactivado (cola perfiles.empleado_reactivado)

Publica:
- No publica eventos

## Pruebas
- `go test ./...`

## CI/CD
- Jenkinsfile en `servidor-perfiles/Jenkinsfile`
- Job declarado en `jenkins/casc.yaml` como `perfiles-ci`

## Participacion en el flujo general
- Sincroniza el perfil con el estado del empleado consumiendo eventos de alta, baja y reactivacion.
