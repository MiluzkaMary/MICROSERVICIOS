# Sistema de Microservicios - Gestion de Empleados

Sistema de gestion de empleados basado en microservicios con Node.js, Express, PostgreSQL, RabbitMQ y Docker Compose.

## Descripcion general

Servicios del sistema:
- servidor-empleados
- servidor-auth
- servidor-departamentos
- servidor-perfiles
- servidor-notificaciones

Cada microservicio mantiene su propia base de datos PostgreSQL.

## Arquitectura

Servicios en Docker Compose:
- empleados-service: 8080
- auth-service: 8084
- departamentos-service: 8081
- perfiles-service: 8082
- notificaciones-service: 8083
- rabbitmq: 5672 (AMQP), 15672 (UI)
- mailhog: 1025 (SMTP), 8025 (UI)

Bases de datos:
- empleados_db (5432)
- auth_db (5436)
- departamentos_db (5433)
- perfiles_db (5434)
- notificaciones_db (5435)

## Comunicacion entre servicios

HTTP sincronico:
- servidor-empleados valida departamentos llamando a servidor-departamentos.

RabbitMQ asincronico:
- Exchange: empleados_events (topic)
- Eventos: empleado.creado, empleado.eliminado, usuario.creado, usuario.recuperacion

## Flujo principal

Alta de empleado:
1. ADMIN crea empleado en servidor-empleados.
2. Se publica empleado.creado.
3. servidor-auth crea usuario y publica usuario.creado.
4. servidor-perfiles crea perfil.
5. servidor-notificaciones envia email de activacion/bienvenida.

Eliminacion de empleado:
1. ADMIN elimina empleado en servidor-empleados.
2. Se publica empleado.eliminado.
3. servidor-auth desactiva usuario.
4. servidor-perfiles elimina perfil.
5. servidor-notificaciones envia notificacion de desvinculacion.

Recuperacion de password:
1. Usuario ejecuta POST /auth/recover-password.
2. servidor-auth publica usuario.recuperacion.
3. servidor-notificaciones envia correo con token.
4. Usuario ejecuta POST /auth/reset-password.

## Seguridad (resumen)

- JWT emitido por servidor-auth en POST /auth/login.
- Claims usados: sub, role, iat, exp.
- Validacion de token en empleados, departamentos, perfiles y notificaciones.
- RBAC implementado con roles ADMIN y USER.
- Endpoints administrativos protegidos con requiereAdmin.

Detalle completo en SECURITY.md.

## Ejecucion con Docker Compose

Levantar entorno:

```bash
docker-compose up --build
```

Detener entorno:

```bash
docker-compose down
```

## Pruebas basicas

Health checks:

```bash
curl http://localhost:8080/health
curl http://localhost:8081/health
curl http://localhost:8082/health
curl http://localhost:8083/health
curl http://localhost:8084/health
```

Login (auth):

```bash
curl -X POST http://localhost:8084/auth/login -H "Content-Type: application/json" -d '{"email":"admin@empresa.com","password":"admin123"}'
```

## Tecnologias

- Node.js
- Express
- PostgreSQL
- RabbitMQ
- Docker Compose
- Swagger (swagger-jsdoc, swagger-ui-express)
- JWT (jsonwebtoken)
- bcryptjs
- opossum (circuit breaker en servidor-empleados)

## Documentacion relacionada

- SECURITY.md
- MESSAGE_BROKER_RABBITMQ.md
- CIRCUIT_BREAKER.md
- usuario.creado (publisher: auth-service)
- usuario.recuperacion (publisher: auth-service)

Eventos consumidos:
- auth-service: empleado.creado, empleado.eliminado
- perfiles-service: empleado.creado, empleado.eliminado
- notificaciones-service: empleado.creado, empleado.eliminado, usuario.creado, usuario.recuperacion

## 6. Endpoints principales por servicio

Auth (prefijo /auth):
- POST /auth/login
- POST /auth/recover-password
- POST /auth/reset-password
- GET /health

Empleados (prefijo /empleados):
- POST /empleados
- GET /empleados
- GET /empleados/:id
- PUT /empleados/:id
- DELETE /empleados/:id
- GET /circuit-breaker/status
- GET /health

Departamentos (prefijo /departamentos):
- POST /departamentos
- GET /departamentos
- GET /departamentos/:id
- GET /health

Perfiles (prefijo /perfiles):
- GET /perfiles
- GET /perfiles/:empleadoId
- PUT /perfiles/:empleadoId
- POST /perfiles/evento/empleado-creado (endpoint interno)
- GET /health

Notificaciones (prefijo /notificaciones):
- GET /notificaciones
- GET /notificaciones/estadisticas/resumen
- GET /notificaciones/:empleadoId
- POST /notificaciones/evento/empleado-creado (endpoint interno)
- POST /notificaciones/evento/empleado-desvinculado (endpoint interno)
- GET /health

## 7. Ejecucion con Docker Compose

Desde la raiz del proyecto:

docker-compose up --build

Detener servicios:

docker-compose down

Swagger por servicio:
- http://localhost:8084/api-docs
- http://localhost:8080/api-docs
- http://localhost:8081/api-docs
- http://localhost:8082/api-docs
- http://localhost:8083/api-docs

## 8. Pruebas basicas del sistema

1) Health checks:
- GET http://localhost:8084/health
- GET http://localhost:8080/health
- GET http://localhost:8081/health
- GET http://localhost:8082/health
- GET http://localhost:8083/health

2) Login admin inicial (cuando auth_db se inicializa desde cero):
- Email: admin@empresa.com
- Password: admin123
- Endpoint: POST /auth/login

3) Crear empleado con token ADMIN:
- POST /empleados

4) Validar efectos:
- Perfil creado en perfiles_db
- Usuario creado en auth_db
- Notificacion/Email de activacion en notificaciones + Mailhog

5) Eliminar empleado con token ADMIN:
- DELETE /empleados/:id

6) Validar efectos de eliminacion:
- Empleado eliminado en empleados_db
- Perfil eliminado en perfiles_db
- Usuario desactivado en auth_db
- Notificacion de desvinculacion enviada

## 9. Tecnologias usadas

- Node.js 20
- Express 4
- PostgreSQL 15
- RabbitMQ 3.12 (management)
- Mailhog
- Docker / Docker Compose
- Swagger (swagger-jsdoc, swagger-ui-express)
- jsonwebtoken
- amqplib
- opossum (circuit breaker en empleados-service)
- nodemailer (notificaciones-service)

## Documentacion del repositorio (organizada)

Seguridad:
- SECURITY.md
- SEGURIDAD_RECUPERACION_PASSWORD.md
- GUIA_PROTECCION_JWT.md

Ejecucion y uso:
- COMANDOS.md
- GUIA_POSTMAN_RECUPERACION.md

Arquitectura tecnica:
- PRUEBA_CIRCUIT_BREAKER.md
- MESSAGE_BROKER_RABBITMQ.md

Calidad:
- CALIDAD_HTTP_RESPUESTAS.md
- CHANGELOG_SECURITY.md
