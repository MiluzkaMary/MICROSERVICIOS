# servidor-departamentos

## Descripcion del servicio
Servicio de catalogo de departamentos.

## Responsabilidad dentro del sistema
- Mantener el catalogo de departamentos.
- Responder validaciones de departamento para servidor-empleados.

## Endpoints reales
- POST /departamentos
- GET /departamentos
- GET /departamentos/:id
- GET /health
- GET /api-docs
- GET /api-docs.json

## Base de datos
- Motor: PostgreSQL
- Base: departamentos_db
- Tabla principal: departamentos

Campos relevantes:
- id
- nombre
- descripcion

Seed en init.sql:
- Tecnologia
- Recursos Humanos
- Ventas
- Marketing
- Finanzas

## Eventos RabbitMQ
- No publica eventos.
- No consume eventos.

## Participacion en el flujo general
- Sirve como dependencia sincronica de servidor-empleados para validar departamento_id en altas.
