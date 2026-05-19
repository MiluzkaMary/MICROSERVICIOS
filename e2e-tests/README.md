# BDD E2E con Cucumber.js

## Que es BDD y por que este enfoque

BDD, o Behavior Driven Development, describe el comportamiento del sistema con escenarios legibles para negocio y para desarrollo. En vez de verificar manualmente con `curl` o Postman, los escenarios quedan como documentacion viva y reproducible, con aserciones automaticas y salida resumida en consola.

Este enfoque encaja bien en este proyecto porque el dominio ya esta distribuido en microservicios y los flujos relevantes dependen de eventos asincronos, autenticacion JWT y reglas de negocio por rol.

## Prerrequisitos

- Node.js 18 o superior.
- El sistema levantado con `docker-compose`.
- Variables de entorno configuradas para el entorno de prueba.

## Variables de entorno requeridas

```env
BASE_URL=http://localhost:8085
ADMIN_EMAIL=admin@empresa.com
ADMIN_PASSWORD=admin123
USER_EMAIL=juan.solis@gmail.com
USER_PASSWORD=Rabbit
POLLING_MAX_ATTEMPTS=30
POLLING_INTERVAL_MS=3000
CUCUMBER_STEP_TIMEOUT_MS=120000
```

## Instrucciones paso a paso

1. Levantar el sistema:

```bash
docker-compose up --build -d
```

2. Ir a la carpeta de pruebas:

```bash
cd e2e-tests
```

3. Instalar dependencias:

```bash
npm install
```

4. Configurar variables:

```bash
cp .env.example .env
```

Edita `.env` con tus valores locales.

5. Ejecutar la suite:

```bash
npm test
```

Si ejecutas por Docker Compose, reconstruye la imagen de pruebas cuando cambies steps, hooks o soporte:

```bash
docker compose --profile testing run --rm --build bdd-tests
```

## Escenarios implementados

| Feature | Escenario | Que verifica |
| --- | --- | --- |
| `01_sistema.feature` | El gateway rechaza un login invalido de forma controlada | Validacion basica del borde HTTP |
| `01_sistema.feature` | Un administrador puede consultar empleados a traves del gateway | Routing y acceso correcto por gateway |
| `02_seguridad.feature` | Acceso denegado sin token | Respuesta 401 sin JWT |
| `02_seguridad.feature` | Acceso denegado con token invalido | Respuesta 401 ante JWT malformado |
| `02_seguridad.feature` | Un usuario USER no puede crear un empleado | Control de rol 403 |
| `02_seguridad.feature` | Un usuario USER no puede eliminar un empleado | Control de rol 403 |
| `02_seguridad.feature` | Un usuario ADMIN puede crear un departamento exitosamente | Operacion administrativa permitida |
| `02_seguridad.feature` | Un usuario ADMIN puede listar empleados | Lectura protegida permitida |
| `03_onboarding.feature` | Registro exitoso con verificacion asincronica de credenciales | Alta de empleado y propagacion a auth |
| `03_onboarding.feature` | Registro exitoso con verificacion asincronica de notificacion | Creacion de notificacion de bienvenida |
| `03_onboarding.feature` | El nuevo empleado puede hacer login | Flujo completo de activacion y acceso |
| `03_onboarding.feature` | Registro con departamento inexistente | Validacion de integridad referencial |
| `03_onboarding.feature` | Registro con campos faltantes | Validaciones de entrada |
| `04_offboarding.feature` | Desvinculacion completa | Baja logica y notificacion |
| `04_offboarding.feature` | Empleado desvinculado no puede hacer login | Inactivacion efectiva |
| `04_offboarding.feature` | Recuperacion de contraseña falla para empleado desvinculado | Rechazo de cuentas inactivas |

## Justificacion de herramientas

- Cucumber.js: se integra bien con el ecosistema JavaScript ya usado en el proyecto y permite escribir escenarios en lenguaje de negocio.
- Axios: cliente HTTP estable y flexible para las llamadas contra el gateway y los servicios.
- UUID: evita colisiones de datos entre escenarios y mejora el aislamiento.

## Interpretacion de resultados

La ejecucion muestra un resumen en consola con el estado de escenarios y pasos. Cuando un escenario falla, los hooks imprimen el detalle de la ultima respuesta HTTP para facilitar el diagnostico.

Si un escenario falla de forma intermitente, suele indicar una condicion asincrona no esperada o un timeout demasiado corto. En esta suite, los pasos `eventualmente` usan polling para reducir ese riesgo y evitar esperas fijas innecesarias.

## .env.example

El archivo `.env.example` contiene solo las variables necesarias para ejecutar la suite sin exponer secretos.