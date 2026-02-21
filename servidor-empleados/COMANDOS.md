
## Iniciar el servicio por primera vez

```powershell
docker-compose up --build
```

## Detener el servicio

```powershell
docker-compose down
```

## Actualizar el servicio con cambios en el código

**Opción 1: Todo en uno (Recomendado)**
```powershell
docker-compose down; docker-compose up --build
```

**Opción 2: Paso a paso**
```powershell
# 1. Detener contenedores
docker-compose down

# 2. Reconstruir sin caché (fuerza usar código nuevo)
docker-compose build --no-cache

# 3. Levantar el servicio
docker-compose up
```

## Volver a levantar el servicio (sin cambios)

```powershell
docker-compose up
```

O en segundo plano:
```powershell
docker-compose up -d
```

## Probar que funciona

```powershell
curl http://localhost:8080/health
```

## Ver logs en tiempo real

```powershell
docker-compose logs -f
```

## Acceder a la base de datos

```powershell
docker exec -it empleados-postgres psql -U postgres -d empleados_db
```

---

## Ejemplos de uso de la API

### Paginación básica

**Primera página (10 empleados por defecto)**
```powershell
curl http://localhost:8080/empleados?page=1
```

**Primera página, 5 empleados**
```powershell
curl http://localhost:8080/empleados?page=1&size=5
```

**Segunda página, 5 empleados**
```powershell
curl http://localhost:8080/empleados?page=2&size=5
```

**Tercera página, 10 empleados**
```powershell
curl http://localhost:8080/empleados?page=3&size=10
```

### Paginación con filtros

**Solo empleados ACTIVOS, primera página de 5**
```powershell
curl "http://localhost:8080/empleados?page=1&size=5&estado=ACTIVO"
```

**Área TI, segunda página de 3**
```powershell
curl "http://localhost:8080/empleados?page=2&size=3&area=TI"
```

**Búsqueda general por 'juan', 10 por página**
```powershell
curl "http://localhost:8080/empleados?page=1&size=10&q=juan"
```

**Ordenar por apellido descendente**
```powershell
curl "http://localhost:8080/empleados?page=1&size=10&sortBy=apellido&order=DESC"
```

### Crear empleado

```powershell
curl -X POST http://localhost:8080/empleados -H "Content-Type: application/json" -d '{\"id\":\"E001\",\"nombre\":\"Juan\",\"apellido\":\"Perez\",\"email\":\"juan@example.com\",\"numeroEmpleado\":\"001\",\"cargo\":\"Desarrollador\",\"area\":\"TI\"}'
```

### Obtener empleado por ID

```powershell
curl http://localhost:8080/empleados/E001
```
