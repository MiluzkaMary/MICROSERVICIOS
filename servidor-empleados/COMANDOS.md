
## Iniciar el servicio por primera vez

```powershell
docker-compose up --build
```

## Detener el servicio

```powershell
docker-compose down
```


## Volver a levantar el servicio

```powershell
docker-compose up
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
