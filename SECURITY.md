# 🔐 Guía de Seguridad - Variables de Entorno

Este documento explica las mejoras de seguridad implementadas relacionadas con la gestión de variables de entorno y secretos.

---

## 📋 Resumen de Mejoras

### ✅ Cambios Implementados

1. **Archivos `.env` externalizados**
   - Credenciales fuera del código fuente
   - Separación entre plantilla (`.env.example`) y valores reales (`.env`)

2. **Protección con `.gitignore`**
   - Archivos `.env` nunca se suben a Git
   - Prevención de exposición accidental de secretos

3. **Parametrización de URLs**
   - URLs hardcodeadas reemplazadas por variables de entorno
   - Flexibilidad para diferentes entornos (dev, staging, prod)

4. **Valores por defecto seguros**
   - Fallbacks en código solo para desarrollo local
   - Documentación clara de valores temporales

---

## 🔧 Configuración Inicial

### Antes del Primer Uso

**1. Crear archivo `.env` desde la plantilla:**
```bash
# En la raíz del proyecto
cp .env.example .env
```

**2. Generar JWT_SECRET seguro:**
```bash
# Opción 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opción 2: OpenSSL
openssl rand -hex 32

# Opción 3: PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**3. Editar `.env` con valores generados:**
```env
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890
DB_PASSWORD=postgres
RABBITMQ_PASSWORD=guest
# Seguridad - JWT, RBAC y Auth

## Alcance

Este documento describe la seguridad implementada en el proyecto:
- auth-service
- JWT
- validacion de token en microservicios
- RBAC por rol ADMIN/USER
- activacion y recuperacion de password

## Auth-service

Servicio responsable de:
- login
- recuperacion de password
- reset de password
- provision de usuarios por eventos de empleados

Endpoints:
- POST /auth/login
- POST /auth/recover-password
- POST /auth/reset-password

Tabla principal en auth_db: usuarios
- empleado_id
- email
- password_hash
- role
- activo

## Flujo de login

1. Cliente envia email y password a POST /auth/login.
2. auth-service valida:
- usuario existe
- usuario activo
- password_hash disponible
- password correcta (bcrypt.compare)
3. auth-service firma JWT y retorna token + datos de usuario.

## JWT implementado

Claims reales en token:
- sub: empleadoId
- role: rol del usuario
- iat: issued at
- exp: expiracion

Firma:
- jsonwebtoken
- secreto: JWT_SECRET compartido entre servicios

Uso:
- Header Authorization: Bearer <token>

## Validacion del token en microservicios

Microservicios con middleware JWT:
- servidor-empleados
- servidor-departamentos
- servidor-perfiles
- servidor-notificaciones

Comportamiento del middleware:
- extrae token Bearer
- valida firma y expiracion con jwt.verify
- inyecta req.usuario con empleadoId (sub) y role

## RBAC implementado

Roles:
- ADMIN
- USER

Reglas por servicio:

servidor-empleados
- POST /empleados -> ADMIN
- PUT /empleados/:id -> ADMIN
- DELETE /empleados/:id -> ADMIN
- GET /empleados -> USER o ADMIN
- GET /empleados/:id -> USER o ADMIN

servidor-departamentos
- POST /departamentos -> ADMIN
- GET /departamentos -> USER o ADMIN
- GET /departamentos/:id -> USER o ADMIN

servidor-perfiles
- GET /perfiles -> USER o ADMIN
- GET /perfiles/:empleadoId -> USER o ADMIN
- PUT /perfiles/:empleadoId -> USER o ADMIN

servidor-notificaciones
- GET /notificaciones -> ADMIN
- GET /notificaciones/estadisticas/resumen -> ADMIN
- GET /notificaciones/:empleadoId -> USER o ADMIN

## Flujo de activacion de usuario

1. servidor-empleados publica empleado.creado.
2. auth-service consume empleado.creado.
3. Crea usuario con role USER y password_hash NULL.
4. Genera token JWT stateless con claims sub/type/iat/exp.
5. Publica el token en el evento usuario.creado.
6. Publica usuario.creado.
7. servidor-notificaciones envia correo de activacion.
8. Usuario ejecuta POST /auth/reset-password para establecer password.

## Flujo de recuperacion de password

1. Usuario ejecuta POST /auth/recover-password con email.
2. auth-service valida existencia y estado activo.
3. Genera token JWT stateless con claims sub/type/iat/exp.
4. No persiste token en auth_db; la validez se determina por firma y exp.
5. Publica usuario.recuperacion.
6. servidor-notificaciones envia correo con token.
7. Usuario ejecuta POST /auth/reset-password con token + nuevaPassword.
8. auth-service valida JWT y expiracion con jwt.verify y actualiza password_hash.

## Propagacion de token entre servicios

En la creacion de empleado:
- servidor-empleados reenvia el token Authorization al llamar por HTTP a servidor-departamentos para validar departamento.

## Consideraciones operativas

- JWT_SECRET debe ser el mismo en auth-service y en los microservicios que validan token.
- .env esta excluido en .gitignore.
|---------|--------|------------------|
| `JWT_SECRET` | **Alto** | Generar valor aleatorio fuerte (32+ caracteres) |
| Usuario Admin | **Alto** | Cambiar contraseña de `admin123` inmediatamente |

### 🟡 MEDIO - Buenas Prácticas

| Secreto | Riesgo | Recomendación |
|---------|--------|---------------|
| `DB_PASSWORD` | Medio | Usar contraseñas diferentes para cada ambiente |
| `RABBITMQ_PASSWORD` | Medio | Usar credenciales no-default en producción |

### 🟢 BAJO - Desarrollo Local

| Configuración | Estado | Justificación |
|---------------|--------|---------------|
| Valores por defecto | Aceptable | Solo para docker-compose local |
| Servicios en localhost | Aceptable | No expuestos públicamente |
| Usuario admin seed | Aceptable | Solo para pruebas locales |

---

## 📚 Comparación: Antes vs Después

### ❌ ANTES (Hardcoded)

```yaml
# docker-compose.yml
services:
  empleados-service:
    environment:
      - JWT_SECRET=tu-super-secreto-jwt-cambiar-en-produccion
      - DB_PASSWORD=postgres
```

**Problemas:**
- Secretos visibles en Git
- Difícil cambiar valores por ambiente
- Riesgo de exponer credenciales

---

### ✅ DESPUÉS (Parametrizado)

```yaml
# docker-compose.yml
services:
  empleados-service:
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - DB_PASSWORD=${DB_PASSWORD:-postgres}
```

```bash
# .env (NO en Git)
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890
DB_PASSWORD=mi-password-segura
```

**Beneficios:**
- Secretos fuera del código fuente
- Fácil cambiar por ambiente
- `.gitignore` previene exposición accidental

---

## 🧪 Verificación

### Verificar que `.env` está ignorado

```bash
# Ver archivos ignorados
git status --ignored

# Debe aparecer:
# .env
```

### Verificar que variables se cargan correctamente

```bash
# Levantar servicios
docker-compose up -d

# Ver variables de un servicio
docker exec empleados-app printenv | grep JWT_SECRET

# Debe mostrar el valor de tu .env
```

---

## 🎯 Mejores Prácticas

### ✅ Hacer

- ✅ Usar `.env.example` como plantilla documentada
- ✅ Mantener `.env` local y nunca subirlo a Git
- ✅ Generar `JWT_SECRET` aleatorio de 32+ caracteres
- ✅ Usar gestores de secretos en producción (AWS Secrets Manager, Vault)
- ✅ Rotar secretos periódicamente
- ✅ Documentar variables requeridas

### ❌ No Hacer

- ❌ Hardcodear secretos en código fuente
- ❌ Subir archivos `.env` a Git
- ❌ Usar el mismo `JWT_SECRET` en dev y prod
- ❌ Compartir secretos por email/chat
- ❌ Dejar valores por defecto en producción
- ❌ Usar contraseñas débiles o predecibles

---

## 📖 Referencias

**Documentación relacionada:**
- [README.md](README.md) - Guía general del proyecto
- [GUIA_PROTECCION_JWT.md](GUIA_PROTECCION_JWT.md) - Autenticación JWT
- [servidor-auth/README.md](servidor-auth/README.md) - Servicio de autenticación

**Herramientas recomendadas:**
- [dotenv](https://www.npmjs.com/package/dotenv) - Node.js (ya incluido)
- [Docker Compose Environment Variables](https://docs.docker.com/compose/environment-variables/)
- [12 Factor App - Config](https://12factor.net/config)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

## 🆘 Solución de Problemas

### Error: "JWT_SECRET no está definido"

**Síntoma:**
```
Error: JWT_SECRET is required
```

**Solución:**
1. Verificar que existe archivo `.env` en la raíz
2. Verificar que `.env` contiene `JWT_SECRET=valor`
3. Reiniciar contenedores: `docker-compose down && docker-compose up -d`

---

### Error: "Token inválido" entre microservicios

**Síntoma:**
```json
{ "error": "Token inválido o expirado" }
```

**Causa:** `JWT_SECRET` diferente entre servicios

**Solución:**
1. Verificar que `JWT_SECRET` es el mismo en `.env`
2. No tener múltiples archivos `.env` en subdirectorios
3. Reconstruir servicios: `docker-compose up -d --build`

---

### Archivos `.env` no se ignoran en Git

**Síntoma:**
Git muestra `.env` como archivo nuevo

**Solución:**
```bash
# Verificar .gitignore existe
cat .gitignore

# Debe contener:
# .env
# .env.local
# .env.*.local

# Si ya lo agregaste por error:
git rm --cached .env
git commit -m "Remove .env from tracking"
```

---

## 📝 Checklist de Seguridad

Antes de desplegar a producción, verificar:

- [ ] Archivo `.env` creado con valores de producción
- [ ] `JWT_SECRET` generado aleatoriamente (32+ caracteres)
- [ ] Contraseñas de base de datos cambiadas
- [ ] Credenciales de RabbitMQ cambiadas
- [ ] Usuario admin seed deshabilitado o contraseña cambiada
- [ ] Variables de URLs actualizadas para producción
- [ ] Archivo `.env` NO está en Git (verificar con `git status`)
- [ ] Archivo `.env.example` está en Git (plantilla sin valores reales)
- [ ] Secrets almacenados en gestor seguro (Vault, AWS Secrets, etc.)
- [ ] Logs NO muestran valores de secretos
- [ ] Documentación de variables actualizada

---

**Última actualización:** Marzo 2026  
**Versión:** 1.0  
**Mantenedor:** Equipo de Desarrollo
