# Sistema de Microservicios - Gestion de Empleados

Sistema de gestion de empleados basado en microservicios, con arquitectura mixta:
- Node.js + Express: empleados, auth, notificaciones y gateway.
- Go: perfiles.
- Python + FastAPI: departamentos.
- PostgreSQL por servicio.
- RabbitMQ para mensajeria asincrona.
- Jenkins para CI/CD y Docker Compose para orquestacion local y ejecucion de pruebas E2E.

## 1. Integracion Continua (CI)

La integracion continua (CI) es una practica que valida de forma automatica los cambios de codigo cada vez que se actualiza el repositorio. En este proyecto se usa para reducir errores de integracion entre microservicios, verificar compilacion y pruebas, y generar evidencia de calidad antes de pasar a despliegue.

CI se integra aqui porque el sistema combina varios lenguajes y varios puntos de coordinacion: APIs HTTP, eventos RabbitMQ, pruebas E2E y analisis de calidad con SonarQube. Un pipeline automatizado permite comprobar todo eso de forma repetible.

## 2. Servicios actuales

- servidor-gateway (entrada externa)
- servidor-empleados (Node.js)
- servidor-auth (Node.js)
- servidor-departamentos (Python/FastAPI)
- servidor-perfiles (Go)
- servidor-notificaciones (Java/Spring Boot)
- e2e-tests (Cucumber.js)

Cada microservicio de dominio mantiene su propia base de datos PostgreSQL.

## 3. Arquitectura y puertos

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

## 4. Seguridad y autorizacion

- JWT emitido por auth en POST /auth/login.
- Claims usados por los servicios: sub y role.
- Roles: ADMIN y USER.
- Validacion de token en empleados, departamentos, perfiles y notificaciones.

Reglas generales:
- ADMIN: operaciones administrativas (crear, editar, desactivar, reactivar, estadisticas).
- USER: operaciones autenticadas de lectura/consulta permitidas por ruta.

## 5. Comunicacion entre servicios

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

## 6. Flujo funcional principal

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

## 7. Modelo de datos (estado actual)

Se estandarizo el campo id autoincremental en tablas principales con SERIAL.

- empleados_db.empleados: id SERIAL PRIMARY KEY
- departamentos_db.departamentos: id SERIAL PRIMARY KEY
- notificaciones_db.notificaciones: id SERIAL PRIMARY KEY
- perfiles_db.perfiles: id SERIAL PRIMARY KEY
- auth_db.usuarios: id SERIAL PRIMARY KEY

Notas:
- La recuperacion de password en auth es stateless con JWT.
- No se persisten token_recuperacion ni token_expiracion en la tabla usuarios.

## 8. Endpoints principales

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

## 9. Pruebas automatizadas

### 9.1 Pruebas unitarias

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

### 9.2 Pruebas E2E con Cucumber

La suite en e2e-tests valida onboarding, offboarding, seguridad y comportamiento del sistema atravesando el gateway.

Comando recomendado (forzando build de imagen de pruebas):

```bash
docker compose --profile testing run --rm --build bdd-tests
```

Estado actual de la suite principal:
- 19 escenarios
- 47 pasos

## 10. Limpieza automatica de datos E2E

Al finalizar la suite E2E (hook AfterAll):
1. Se eliminan los datos de prueba creados durante escenarios.
2. Se reajustan secuencias de IDs por tabla usando MAX(id)+1 para evitar saltos grandes.

Ejemplo equivalente en PostgreSQL:

```sql
ALTER SEQUENCE empleados_id_seq RESTART WITH 6;
```

En el proyecto, este ajuste se aplica de forma automatica tras el cleanup cuando existe secuencia serial en la tabla.

## 11. Variables de entorno clave

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

## 12. Jenkins y CI/CD

### 12.1 Acceso a Jenkins

- URL local: http://localhost:9090
- Credenciales por defecto: `admin` / `admin123`
- El setup wizard de Jenkins esta deshabilitado por CasC para que el entorno arranque preconfigurado.

### 12.2 Como levantar el sistema con Jenkins incluido

1. Configura el archivo `.env` en la raiz.
2. Levanta los servicios con Docker Compose.
3. Asegurate de incluir Jenkins, SonarQube, RabbitMQ, Mailhog y todos los microservicios.

```bash
docker compose up --build -d
```

### 12.3 Como obtener la contraseña inicial de Jenkins

En una instalacion clasica de Jenkins, la contraseña inicial se obtiene desde el archivo `initialAdminPassword` dentro del volumen de Jenkins.

En este proyecto, Jenkins se arranca con Configuration as Code y la credencial por defecto ya queda definida como `admin / admin123`. Si necesitas verificar el secreto inicial del contenedor, puedes leerlo desde la ruta del volumen montado de Jenkins en la carpeta `jenkins_home/secrets/initialAdminPassword`.

### 12.4 Como crear o importar los pipelines

Los pipelines ya quedan creados automaticamente por `jenkins/casc.yaml`.

Si necesitas recrearlos manualmente:
1. En Jenkins, crea un nuevo job de tipo Pipeline.
2. Selecciona `Pipeline script from SCM`.
3. Usa el repositorio del proyecto.
4. Define el `scriptPath` correcto:
	- `servidor-empleados/Jenkinsfile`
	- `servidor-auth/Jenkinsfile`
	- `servidor-departamentos/Jenkinsfile`
	- `servidor-perfiles/Jenkinsfile`
	- `servidor-notificaciones/Jenkinsfile`
	- `servidor-gateway/Jenkinsfile`
	- `e2e-tests/Jenkinsfile`

### 12.5 Como ejecutar un pipeline manualmente

1. Entra a http://localhost:9090.
2. Abre el job que quieras ejecutar.
3. Haz clic en `Build Now`.
4. Revisa la consola del build y los artefactos publicados.

### 12.6 Etapas del pipeline y que verifica cada una

- `Checkout`: descarga el codigo fuente correcto del repositorio.
- `Verificación de herramientas`: comprueba que el agente tiene Node, Go, Java, Maven o Docker segun el servicio.
- `Install Dependencies`: instala dependencias de Node o valida el entorno necesario.
- `Build` o `Construcción Docker`: compila la aplicacion o construye la imagen del servicio.
- `Pruebas Unitarias` o `Test`: ejecuta las pruebas automatizadas del servicio.
- `Análisis de Cobertura`: genera reportes para evaluar cobertura.
- `SonarQube`: ejecuta analisis estatico y calidad de codigo.
- `Quality Gate`: bloquea el pipeline si la calidad no alcanza el umbral configurado.
- `Verificación de Configuración`: valida archivos y rutas necesarias para el servicio o la suite E2E.
- `Publicar Reporte de Tests`: deja visible el resultado de la ejecucion E2E.

### 12.7 Como interpretar los resultados

- Verde: la etapa paso correctamente y su validacion quedo satisfactoria.
- Rojo: la etapa fallo y el pipeline se detuvo o marco error.
- Amarillo o inestable: la etapa termino con advertencias o resultados parciales, normalmente asociados a tests fallidos o a pasos opcionales.

Regla practica:
- Verde en `Checkout`, `Build` y `Test` significa que el servicio sigue siendo compilable y verificable.
- Rojo en `SonarQube` o `Quality Gate` significa que hay que revisar calidad, deuda tecnica o cobertura.
- Rojo en `Test` significa que hay regresiones funcionales y debe corregirse antes de integrar.

### 12.8 Capturas de pantalla de un pipeline exitoso

Para documentacion visual, agrega capturas en una carpeta como `docs/screenshots/` y enlazalas desde aqui. Las capturas recomendadas son:
- Vista general del job con estado verde.
- Consola del build mostrando `SUCCESS`.
- Etapa `Test` terminada correctamente.
- Etapa `SonarQube` o `Quality Gate` en verde.

## 13. Ejecucion local

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

## 14. Verificacion rapida

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

## 15. Documentacion complementaria

- SECURITY.md
- MESSAGE_BROKER_RABBITMQ.md
- CIRCUIT_BREAKER.md
- e2e-tests/README.md
