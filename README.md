# Sistema de Microservicios - Gestion de Empleados

Sistema de gestion de empleados basado en microservicios con Node.js, Express, PostgreSQL, RabbitMQ y Docker Compose.

## 1. Descripcion general

Servicios del sistema:
- servidor-empleados
- servidor-auth
- servidor-departamentos
- servidor-perfiles
- servidor-notificaciones
- servidor-gateway (entrypoint externo)

Cada microservicio mantiene su propia base de datos PostgreSQL.

## 2. Arquitectura y puertos

Servicios de aplicacion:
- empleados-service: 8080
- departamentos-service: 8081
- perfiles-service: 8082
- notificaciones-service: 8083
- auth-service: 8084
- gateway-service: 8085

Infraestructura:
- rabbitmq: 5672 (AMQP), 15672 (UI)
- mailhog: 1025 (SMTP), 8025 (UI)

Bases de datos:
- empleados_db: localhost:5432
- departamentos_db: localhost:5433
- perfiles_db: localhost:5434
- notificaciones_db: localhost:5435
- auth_db: localhost:5436

## 3. Seguridad y roles

- JWT emitido por servidor-auth en POST /auth/login.
- Claims de acceso usados en los servicios: sub y role.
- Validacion de token en empleados, departamentos, perfiles y notificaciones.
- Roles implementados: ADMIN y USER.

Reglas generales:
- ADMIN: operaciones administrativas (crear, editar, desactivar y reactivar empleados; ver estadisticas de notificaciones).
- USER: operaciones autenticadas de consulta y actualizacion permitidas por ruta.

## 4. Comunicacion entre servicios

HTTP sincronico:
- servidor-empleados valida departamentos llamando a servidor-departamentos.

RabbitMQ asincronico:
- Exchange: empleados_events (topic)
- Eventos actuales: empleado.creado, empleado.eliminado, empleado.reactivado, usuario.creado, usuario.recuperacion

Publicadores:
- servidor-empleados: empleado.creado, empleado.eliminado, empleado.reactivado
- servidor-auth: usuario.creado, usuario.recuperacion

Consumidores:
- auth-service: empleado.creado, empleado.eliminado, empleado.reactivado
- perfiles-service: empleado.creado, empleado.eliminado, empleado.reactivado
- notificaciones-service: empleado.creado, empleado.eliminado, empleado.reactivado, usuario.creado, usuario.recuperacion

## 5. Flujo funcional principal

Alta de empleado:
1. ADMIN crea empleado en servidor-empleados.
2. Se publica empleado.creado.
3. servidor-auth crea usuario y publica usuario.creado.
4. servidor-perfiles crea perfil por defecto.
5. servidor-notificaciones registra y envia correos de bienvenida/activacion.

Desactivacion de empleado (baja logica):
1. ADMIN ejecuta DELETE /empleados/:id.
2. Se marca activo=false en empleados y se publica empleado.eliminado.
3. servidor-auth inhabilita usuario (activo=false).
4. servidor-perfiles desactiva perfil (activo=false).
5. servidor-notificaciones registra y envia notificacion de desvinculacion.

Reactivacion de empleado:
1. ADMIN ejecuta PATCH /empleados/:id/reactivar.
2. Se marca activo=true en empleados y se publica empleado.reactivado.
3. servidor-auth reactiva usuario (o lo crea si no existe).
4. servidor-perfiles reactiva perfil (activo=true).
5. servidor-notificaciones registra y envia notificacion de vinculacion/activacion.

Recuperacion de password:
1. Usuario ejecuta POST /auth/recover-password.
2. servidor-auth genera token JWT stateless y publica usuario.recuperacion.
3. servidor-notificaciones envia correo de recuperacion.
4. Usuario ejecuta POST /auth/reset-password.

## 6. Esquemas de datos relevantes

auth_db.usuarios:
- id
- empleado_id
- email
- password_hash
- role
- activo
- created_at
- updated_at

Notas:
- La recuperacion de password es stateless con JWT.
- No se persisten columnas token_recuperacion ni token_expiracion.

empleados_db.empleados:
- id
- nombre
- email
- departamento_id
- fecha_ingreso
- activo
- created_at
- updated_at

perfiles_db.perfiles:
- id
- empleado_id
- nombre
- email
- telefono
- direccion
- ciudad
- biografia
- activo
- fecha_creacion
- fecha_actualizacion

## 7. Endpoints principales por servicio

Auth (prefijo /auth):
- POST /auth/login
- POST /auth/recover-password
- POST /auth/reset-password
- GET /health

Empleados (prefijo /empleados):
- POST /empleados (ADMIN)
- GET /empleados (USER o ADMIN)
- GET /empleados/:id (USER o ADMIN)
- PUT /empleados/:id (ADMIN)
- DELETE /empleados/:id (ADMIN, baja logica)
- PATCH /empleados/:id/reactivar (ADMIN)
- GET /circuit-breaker/status
- GET /health

Departamentos (prefijo /departamentos):
- POST /departamentos (ADMIN)
- GET /departamentos (USER o ADMIN)
- GET /departamentos/:id (USER o ADMIN)
- GET /health

Perfiles (prefijo /perfiles):
- GET /perfiles (USER o ADMIN)
- GET /perfiles/:empleadoId (USER o ADMIN)
- PUT /perfiles/:empleadoId (USER o ADMIN)
- POST /perfiles/evento/empleado-creado (interno)
- GET /health

Notificaciones (prefijo /notificaciones):
- GET /notificaciones (ADMIN)
- GET /notificaciones/estadisticas/resumen (ADMIN)
- GET /notificaciones/:empleadoId (USER o ADMIN)
- GET /health

Gateway:
- Entrada principal: http://localhost:8085

## 8. Variables de entorno claves

Archivo raiz .env:
- JWT_SECRET
- JWT_EXPIRATION
- DB_USER
- DB_PASSWORD
- RABBITMQ_USER
- RABBITMQ_PASSWORD
- AUTH_SERVICE_URL
- SMTP_HOST
- SMTP_PORT
- SMTP_FROM

## 9. Ejecucion

Levantar entorno:

```bash
docker-compose up --build -d
```

Detener entorno:

```bash
docker-compose down
```

Reiniciar borrando volumenes de datos:

```bash
docker-compose down -v
docker-compose up --build -d
```

## 10. Verificacion rapida

Health checks:

```bash
curl http://localhost:8080/health
curl http://localhost:8081/health
curl http://localhost:8082/health
curl http://localhost:8083/health
curl http://localhost:8084/health
```

Swagger por servicio:
- http://localhost:8080/api-docs
- http://localhost:8081/api-docs
- http://localhost:8082/api-docs
- http://localhost:8083/api-docs
- http://localhost:8084/api-docs

## 11. Documentacion relacionada

- SECURITY.md
- MESSAGE_BROKER_RABBITMQ.md
- CIRCUIT_BREAKER.md
