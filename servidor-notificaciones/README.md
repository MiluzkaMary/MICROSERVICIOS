# servidor-notificaciones

## Descripcion del servicio
Servicio de notificaciones por correo y de historial de envios.

## Responsabilidad dentro del sistema
- Procesar eventos de empleados y usuarios.
- Enviar correos de bienvenida, desvinculacion, activacion y recuperacion.
- Registrar estado de notificaciones en base de datos.

## Endpoints reales
- GET /notificaciones
- GET /notificaciones/estadisticas/resumen
- GET /notificaciones/:empleadoId
- POST /notificaciones/evento/empleado-creado (interno)
- POST /notificaciones/evento/empleado-desvinculado (interno)
- GET /health
- GET /api-docs
- GET /api-docs.json

## Base de datos
- Motor: PostgreSQL
- Base: notificaciones_db
- Tabla principal: notificaciones

Campos relevantes:
- tipo (BIENVENIDA, DESVINCULACION, ACTIVACION, RECUPERACION)
- destinatario
- mensaje
- empleado_id
- estado (ENVIADA, FALLIDA, PENDIENTE)

## Eventos RabbitMQ

Exchange: empleados_events

Consume:
- empleado.creado (cola notificaciones.empleado_creado)
- empleado.eliminado (cola notificaciones.empleado_eliminado)
- usuario.creado (cola notificaciones.usuario_creado)
- usuario.recuperacion (cola notificaciones.usuario_recuperacion)

Publica:
- No publica eventos

## Participacion en el flujo general
- Recibe eventos de empleados y auth para ejecutar el envio de correos y guardar historial.
