# Servidor de Notificaciones — Java Spring Boot

Microservicio de notificaciones reescrito íntegramente en **Java 21** con **Spring Boot 3.2**.

## Tecnologías

| Capa | Tecnología |
|------|------------|
| Lenguaje | Java 21 |
| Framework | Spring Boot 3.2 |
| Servidor HTTP | Spring Web (Tomcat embebido) |
| Base de datos | PostgreSQL 15 (Spring Data JPA / Hibernate) |
| Mensajería | RabbitMQ (Spring AMQP) |
| Email | Spring Mail (JavaMailSender → Mailhog) |
| Autenticación | JWT (JJWT 0.12) + Spring Security |
| Documentación | SpringDoc OpenAPI (Swagger UI) |
| Build | Maven 3.9 |
| Container | Docker multi-stage (Maven → JRE 21 Alpine) |

## Estructura del Proyecto

```
servidor-notificaciones/
├── pom.xml
├── Dockerfile
├── .dockerignore
├── init.sql                         # Esquema PostgreSQL (sin cambios)
└── src/
    └── main/
        ├── resources/
        │   └── application.yml      # Configuración
        └── java/com/empresa/notificaciones/
            ├── NotificacionesApplication.java
            ├── config/
            │   ├── AppConfig.java       # ObjectMapper
            │   ├── OpenApiConfig.java   # Swagger
            │   ├── RabbitMQConfig.java  # Queues/Exchanges/Bindings
            │   └── SecurityConfig.java  # Spring Security (JWT)
            ├── controller/
            │   ├── HealthController.java
            │   └── NotificacionController.java
            ├── dto/
            │   ├── ApiResponse.java
            │   ├── EstadisticasDto.java
            │   ├── EventoEmpleadoCreadoRequest.java
            │   ├── EventoEmpleadoDesvinculadoRequest.java
            │   ├── NotificacionDto.java
            │   └── PaginatedResponse.java
            ├── exception/
            │   └── GlobalExceptionHandler.java
            ├── messaging/
            │   └── NotificacionEventConsumer.java   # Listeners RabbitMQ
            ├── model/
            │   └── Notificacion.java                # Entidad JPA
            ├── repository/
            │   ├── NotificacionRepository.java      # JPA Repository
            │   └── NotificacionSpecification.java   # Filtros dinámicos
            ├── security/
            │   ├── JwtAuthFilter.java
            │   └── JwtUtil.java
            └── service/
                ├── EmailService.java
                └── NotificacionService.java
```

## Equivalencias Node.js → Java

| Archivo JS | Clase Java |
|------------|------------|
| `index.js` | `NotificacionesApplication.java` |
| `src/app.js` | `config/SecurityConfig.java` + `config/OpenApiConfig.java` |
| `src/config/database.js` | `application.yml (spring.datasource)` |
| `src/config/email.js` | `application.yml (spring.mail)` + `service/EmailService.java` |
| `src/config/rabbitmq.js` | `config/RabbitMQConfig.java` + `messaging/NotificacionEventConsumer.java` |
| `src/config/swagger.js` | `config/OpenApiConfig.java` |
| `src/controllers/notificacionController.js` | `controller/NotificacionController.java` |
| `src/middlewares/authMiddleware.js` | `security/JwtAuthFilter.java` + `config/SecurityConfig.java` |
| `src/models/notificacion.js` | `model/Notificacion.java` |
| `src/repositories/notificacionRepository.js` | `repository/NotificacionRepository.java` + `NotificacionSpecification.java` |
| `src/routes/notificacionRoutes.js` | `controller/NotificacionController.java` (anotaciones) |
| `src/services/emailService.js` | `service/EmailService.java` |
| `src/services/notificacionService.js` | `service/NotificacionService.java` |
| `src/utils/errorHandler.js` | `exception/GlobalExceptionHandler.java` |
| `src/validators/notificacionValidator.js` | Jakarta Bean Validation (`@Valid`, `@NotBlank`, `@Email`) |

## Endpoints

| Método | Ruta | Acceso |
|--------|------|--------|
| GET | `/health` | Público |
| GET | `/api-docs/swagger-ui.html` | Público |
| GET | `/notificaciones` | Solo ADMIN |
| GET | `/notificaciones/estadisticas/resumen` | Solo ADMIN |
| GET | `/notificaciones/{empleadoId}` | Autenticado |
| POST | `/notificaciones/evento/empleado-creado` | Público (interno) |
| POST | `/notificaciones/evento/empleado-desvinculado` | Público (interno) |

## Variables de Entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | `8083` | Puerto del servidor |
| `DB_HOST` | `localhost` | Host de PostgreSQL |
| `DB_PORT` | `5432` | Puerto de PostgreSQL |
| `DB_USER` | `postgres` | Usuario de PostgreSQL |
| `DB_PASSWORD` | `postgres` | Contraseña de PostgreSQL |
| `DB_NAME` | `notificaciones_db` | Nombre de la base de datos |
| `JWT_SECRET` | `secret-key-...` | Secreto para verificar JWT |
| `SMTP_HOST` | `mailhog` | Host del servidor SMTP |
| `SMTP_PORT` | `1025` | Puerto SMTP |
| `SMTP_FROM` | `rh@empresa.com` | Remitente de emails |
| `AUTH_SERVICE_URL` | `http://auth-service:8084` | URL del servicio de auth (para templates de email) |
| `RABBITMQ_HOST` | `localhost` | Host de RabbitMQ |
| `RABBITMQ_PORT` | `5672` | Puerto AMQP |
| `RABBITMQ_USER` | `guest` | Usuario de RabbitMQ |
| `RABBITMQ_PASSWORD` | `guest` | Contraseña de RabbitMQ |

## Compilar y ejecutar localmente

```bash
# Requiere Java 21 y Maven 3.9+
mvn clean package -DskipTests
java -jar target/servidor-notificaciones-1.0.0.jar
```

## Docker

```bash
docker build -t servidor-notificaciones .
docker run -p 8083:8083 servidor-notificaciones
```
