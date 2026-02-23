# Comandos para Microservicios

Todos los comandos se ejecutan desde la **raíz del proyecto** donde está `docker-compose.yml`.

## 🚀 Iniciar todos los servicios

```powershell
docker-compose up --build
```

Esto levanta:
- Servicio Empleados (puerto 8080)
- PostgreSQL Empleados (puerto 5432)
- Servicio Departamentos (puerto 8081)
- PostgreSQL Departamentos (puerto 5433)

## 🛑 Detener todos los servicios

```powershell
docker-compose down
```

## 🔄 Actualizar servicios con cambios en el código

**Opción 1: Todo en uno **
```powershell
docker-compose down; docker-compose up --build
```

**Opción 2: Paso a paso**
```powershell
# 1. Detener contenedores
docker-compose down

# 2. Reconstruir sin caché (fuerza usar código nuevo)
docker-compose build --no-cache

# 3. Levantar servicios
docker-compose up
```

## 📊 Ver logs en tiempo real

**Todos los servicios:**
```powershell
docker-compose logs -f
```

**Solo empleados:**
```powershell
docker-compose logs -f empleados-service
```

**Solo departamentos:**
```powershell
docker-compose logs -f departamentos-service
```

## 🏥 Health Checks

**Empleados:**
```powershell
curl http://localhost:8080/health
```

**Departamentos:**
```powershell
curl http://localhost:8081/health
```

## 💾 Acceder a las bases de datos

**Empleados:**
```powershell
docker exec -it empleados-postgres psql -U postgres -d empleados_db
```

**Departamentos:**
```powershell
docker exec -it departamentos-postgres psql -U postgres -d departamentos_db
```

## 📋 Ejemplos de Peticiones HTTP

### Orden Recomendado para Pruebas

**1. Primero, verificar que los servicios están corriendo:**
```powershell
curl http://localhost:8080/health
curl http://localhost:8081/health
```

**2. Crear departamentos (si no existen):**
```powershell
curl -X POST http://localhost:8081/departamentos `
  -H "Content-Type: application/json" `
  -d '{\"nombre\": \"Tecnología\", \"descripcion\": \"Desarrollo de software\"}'
```

**3. Listar departamentos para obtener un ID válido:**
```powershell
curl http://localhost:8081/departamentos
```

**4. Crear empleado con un departamentoId válido:**
```powershell
# Usar el ID del departamento creado (ej: 1)
curl -X POST http://localhost:8080/empleados `
  -H "Content-Type: application/json" `
  -d '{\"id\": \"E001\", \"nombre\": \"Juan Pérez\", \"email\": \"juan@example.com\", \"departamentoId\": \"1\", \"fechaIngreso\": \"2024-01-15\"}'
```

### Departamentos

**Crear departamento:**
```powershell
curl -X POST http://localhost:8081/departamentos `
  -H "Content-Type: application/json" `
  -d '{\"nombre\": \"Tecnología\", \"descripcion\": \"Desarrollo de software\"}'
```

**Obtener departamento por ID:**
```powershell
curl http://localhost:8081/departamentos/1
```

**Listar departamentos (primera página, 10 registros):**
```powershell
curl "http://localhost:8081/departamentos?page=1&size=10"
```

**Buscar departamentos por nombre:**
```powershell
curl "http://localhost:8081/departamentos?nombre=Tecnología"
```

**Búsqueda general:**
```powershell
curl "http://localhost:8081/departamentos?q=desarrollo"
```

**Paginación con orden:**
```powershell
curl "http://localhost:8081/departamentos?page=2&size=5&sortBy=nombre&order=ASC"
```

### Empleados

**Crear empleado:**
```powershell
curl -X POST http://localhost:8080/empleados `
  -H "Content-Type: application/json" `
  -d '{\"id\": \"E001\", \"nombre\": \"Juan Pérez\", \"email\": \"juan@example.com\", \"departamentoId\": \"1\", \"fechaIngreso\": \"2024-01-15\"}'
```

**Obtener empleado por ID:**
```powershell
curl http://localhost:8080/empleados/E001
```

**Listar empleados (primera página, 10 registros):**
```powershell
curl "http://localhost:8080/empleados?page=1&size=10"
```

**Buscar empleados:**
```powershell
curl "http://localhost:8080/empleados?q=juan"
```

**Filtrar por nombre y departamento:**
```powershell
curl "http://localhost:8080/empleados?nombre=Juan&departamentoId=1"
```

**Paginación completa:**
```powershell
curl "http://localhost:8080/empleados?page=2&size=5&sortBy=nombre&order=ASC"
```

## 🐳 Comandos Docker adicionales

**Ver estado de contenedores:**
```powershell
docker-compose ps
```

**Eliminar volúmenes (CUIDADO: borra datos de BD):**
```powershell
docker-compose down -v
```

**Reconstruir solo un servicio:**
```powershell
docker-compose up --build empleados-service
```

**Ver recursos usados:**
```powershell
docker stats
```

**Limpiar todo Docker (sistema completo):**
```powershell
docker system prune -a
```

## 🔍 Debugging

**Ver logs de un contenedor específico:**
```powershell
docker logs empleados-app
docker logs departamentos-app
docker logs empleados-postgres
docker logs departamentos-postgres
```

**Ejecutar comandos dentro de un contenedor:**
```powershell
docker exec -it empleados-app sh
docker exec -it departamentos-app sh
```

**Inspeccionar red:**
```powershell
docker network inspect reto1_microservicios-network
```

## 📝 Notas Importantes

1. **Puerto 8080**: Servicio de Empleados
2. **Puerto 8081**: Servicio de Departamentos
3. **Puerto 5432**: PostgreSQL Empleados (externo)
4. **Puerto 5433**: PostgreSQL Departamentos (externo)
5. **Códigos HTTP**: Se usa **201** para respuestas exitosas (convención del proyecto)
6. **Docker Compose**: Solo usar el archivo en la raíz, no los individuales de cada servicio

## 🧪 Pruebas de Comunicación Entre Servicios

### Escenario 1: Crear empleado con departamento válido (✅ Caso exitoso)

```powershell
# 1. Crear departamento
curl -X POST http://localhost:8081/departamentos `
  -H "Content-Type: application/json" `
  -d '{\"nombre\": \"Ingeniería\", \"descripcion\": \"Desarrollo de productos\"}'

# 2. Crear empleado (departamentoId: 1)
curl -X POST http://localhost:8080/empleados `
  -H "Content-Type: application/json" `
  -d '{\"id\": \"E100\", \"nombre\": \"Ana García\", \"email\": \"ana@example.com\", \"departamentoId\": \"1\", \"fechaIngreso\": \"2024-01-01\"}'

# Respuesta esperada: 201 Created
```

### Escenario 2: Crear empleado con departamento inexistente (❌ 400 Bad Request)

```powershell
curl -X POST http://localhost:8080/empleados `
  -H "Content-Type: application/json" `
  -d '{\"id\": \"E200\", \"nombre\": \"Carlos López\", \"email\": \"carlos@example.com\", \"departamentoId\": \"999\", \"fechaIngreso\": \"2024-01-01\"}'

# Respuesta esperada: 400 Bad Request
# {
#   "error": "Bad Request",
#   "message": "El departamento con id 999 no existe",
#   "errors": ["departamentoId inválido"]
# }
```

### Escenario 3: Servicio de departamentos caído (❌ 503 Service Unavailable)

```powershell
# 1. Detener solo el servicio de departamentos
docker stop departamentos-app

# 2. Intentar crear empleado
curl -X POST http://localhost:8080/empleados `
  -H "Content-Type: application/json" `
  -d '{\"id\": \"E300\", \"nombre\": \"María Ruiz\", \"email\": \"maria@example.com\", \"departamentoId\": \"1\", \"fechaIngreso\": \"2024-01-01\"}'

# Respuesta esperada: 503 Service Unavailable
# {
#   "error": "Service Unavailable",
#   "message": "Servicio de departamentos no disponible. Intente nuevamente más tarde.",
#   "errors": ["El servicio de validación de departamentos no está respondiendo"]
# }

# 3. Restaurar servicio de departamentos
docker start departamentos-app
```

### Verificar Logs de Comunicación

```powershell
# Ver logs del servicio de empleados (incluye comunicación HTTP)
docker logs empleados-app -f

# Verás mensajes como:
# "Validando departamento 1 en http://departamentos-service:8081/departamentos/1"
# "Departamento 1 validado correctamente"
# O en caso de error:
# "Reintento 1/2 para http://departamentos-service:8081/departamentos/1"
```
