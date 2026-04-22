# Sistema de Microservicios - Gestion de Empleados

Sistema de gestion de empleados basado en microservicios, con arquitectura mixta:
- Node.js + Express: empleados, auth, perfiles, notificaciones y gateway.
- Python + FastAPI: departamentos.
- PostgreSQL por servicio.
- RabbitMQ para mensajeria asincrona.
- Docker Compose para orquestacion local y ejecucion de pruebas E2E.

## 1. Servicios actuales

- servidor-gateway (entrada externa)
- servidor-empleados (Node.js)
- servidor-auth (Node.js)
- servidor-departamentos (Python/FastAPI)
- servidor-perfiles (Node.js)
- servidor-notificaciones (Node.js)
- e2e-tests (Cucumber.js)

Cada microservicio de dominio mantiene su propia base de datos PostgreSQL.

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

## 3. Seguridad y autorizacion

- JWT emitido por auth en POST /auth/login.
- Claims usados por los servicios: sub y role.
- Roles: ADMIN y USER.
- Validacion de token en empleados, departamentos, perfiles y notificaciones.

Reglas generales:
- ADMIN: operaciones administrativas (crear, editar, desactivar, reactivar, estadisticas).
- USER: operaciones autenticadas de lectura/consulta permitidas por ruta.

## 4. Comunicacion entre servicios

HTTP sincronico:
- servidor-empleados valida la existencia de departamento llamando a servidor-departamentos.

RabbitMQ asincronico:
- Exchange: empleados_events (topic)
- Eventos: empleado.creado, empleado.eliminado, empleado.reactivado, usuario.creado, usuario.recuperacion

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
5. servidor-notificaciones registra y envia notificaciones/correos.

Desvinculacion:
1. ADMIN ejecuta DELETE /empleados/:id.
2. Empleado queda inactivo y se publica empleado.eliminado.
3. auth inhabilita usuario.
4. perfiles desactiva perfil.
5. notificaciones registra notificacion de desvinculacion.

Reactivacion:
1. ADMIN ejecuta PATCH /empleados/:id/reactivar.
2. Empleado se reactiva y se publica empleado.reactivado.
3. auth reactiva (o crea) usuario.
4. perfiles reactiva perfil.
5. notificaciones registra notificacion de vinculacion/activacion.

Recuperacion de password:
1. Usuario ejecuta POST /auth/recover-password.
2. auth genera token JWT stateless y publica usuario.recuperacion.
3. notificaciones envia correo de recuperacion.
4. Usuario ejecuta POST /auth/reset-password.

## 6. Modelo de datos (estado actual)

Se estandarizo el campo id autoincremental en tablas principales con SERIAL.

- empleados_db.empleados: id SERIAL PRIMARY KEY
- departamentos_db.departamentos: id SERIAL PRIMARY KEY
- notificaciones_db.notificaciones: id SERIAL PRIMARY KEY
- perfiles_db.perfiles: id SERIAL PRIMARY KEY
- auth_db.usuarios: id SERIAL PRIMARY KEY

Notas:
- La recuperacion de password en auth es stateless con JWT.
- No se persisten token_recuperacion ni token_expiracion en la tabla usuarios.

## 7. Endpoints principales

Auth (/auth):
- POST /auth/login
- POST /auth/recover-password
- POST /auth/reset-password
- GET /health

Empleados (/empleados):
- POST /empleados (ADMIN)
- GET /empleados (USER o ADMIN)
- GET /empleados/:id (USER o ADMIN)
- PUT /empleados/:id (ADMIN)
- DELETE /empleados/:id (ADMIN)
- PATCH /empleados/:id/reactivar (ADMIN)
- GET /circuit-breaker/status
- GET /health

Departamentos (/departamentos) - Python/FastAPI:
- POST /departamentos (ADMIN)
- GET /departamentos (USER o ADMIN)
- GET /departamentos/:id (USER o ADMIN)
- GET /health

Perfiles (/perfiles):
- GET /perfiles
- GET /perfiles/:empleadoId
- PUT /perfiles/:empleadoId
- GET /health

Notificaciones (/notificaciones):
- GET /notificaciones
- GET /notificaciones/estadisticas/resumen
- GET /notificaciones/:empleadoId
- GET /health

Gateway:
- Entrada principal: http://localhost:8085

## 8. Pruebas automatizadas

### 8.1 Pruebas unitarias

servidor-empleados cuenta con una suite unitaria activa en tests/unit, incluyendo:
- app
- middlewares de auth
- repositorio de empleados
- servicio de empleados
- validador de empleados
- circuit breaker y cliente HTTP
- manejo de errores

Comando:

```bash
cd servidor-empleados
npm run test:coverage
```

servidor-departamentos (Python/FastAPI) incluye pruebas unitarias/smoke basicas en tests/test_smoke.py.

Comando:

```bash
cd servidor-departamentos
pytest -q
```

### 8.2 Pruebas E2E con Cucumber

La suite en e2e-tests valida onboarding, offboarding, seguridad y comportamiento del sistema atravesando el gateway.

Comando recomendado (forzando build de imagen de pruebas):

```bash
docker compose --profile testing run --rm --build bdd-tests
```

Estado actual de la suite principal:
- 19 escenarios
- 47 pasos

## 9. Limpieza automatica de datos E2E

Al finalizar la suite E2E (hook AfterAll):
1. Se eliminan los datos de prueba creados durante escenarios.
2. Se reajustan secuencias de IDs por tabla usando MAX(id)+1 para evitar saltos grandes.

Ejemplo equivalente en PostgreSQL:

```sql
ALTER SEQUENCE empleados_id_seq RESTART WITH 6;
```

En el proyecto, este ajuste se aplica de forma automatica tras el cleanup cuando existe secuencia serial en la tabla.

## 10. Variables de entorno clave

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
- ADMIN_EMAIL
- ADMIN_PASSWORD
- USER_EMAIL
- USER_PASSWORD

## 11. Ejecucion local

Levantar entorno:

```bash
docker compose up --build -d
```

Detener entorno:

```bash
docker compose down
```

Reiniciar desde cero (incluye regenerar esquemas de DB desde init.sql):

```bash
docker compose down -v
docker compose up --build -d
```

## 12. Verificacion rapida

Health checks:

```bash
curl http://localhost:8080/health
curl http://localhost:8081/health
curl http://localhost:8082/health
curl http://localhost:8083/health
curl http://localhost:8084/health
```

Swagger:
- empleados: http://localhost:8080/api-docs
- departamentos: http://localhost:8081/api-docs
- perfiles: http://localhost:8082/api-docs
- notificaciones: http://localhost:8083/api-docs
- auth: http://localhost:8084/api-docs

## 13. Documentacion complementaria

- SECURITY.md
- MESSAGE_BROKER_RABBITMQ.md
- CIRCUIT_BREAKER.md
- e2e-tests/README.md
