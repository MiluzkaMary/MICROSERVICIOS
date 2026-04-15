# language: es
Característica: Seguridad
  Como usuario del sistema
  Quiero que las rutas protegidas respeten JWT y roles
  Para garantizar control de acceso consistente.

  Escenario: Acceso denegado sin token
    Cuando consulto la lista de empleados sin token
    Entonces la respuesta debe tener codigo 401

  Escenario: Acceso denegado con token invalido
    Cuando uso un token invalido para consultar empleados
    Entonces la respuesta debe tener codigo 401

  @necesita-user
  Escenario: Un usuario USER no puede crear un empleado
    Cuando intento crear un empleado con rol USER
    Entonces la respuesta debe tener codigo 403

  @necesita-user
  Escenario: Un usuario USER no puede eliminar un empleado
    Cuando intento eliminar un empleado con rol USER
    Entonces la respuesta debe tener codigo 403

  @necesita-admin
  Escenario: Un usuario ADMIN puede crear un departamento exitosamente
    Cuando creo un departamento de prueba
    Entonces la respuesta debe tener codigo 201

  @necesita-admin
  Escenario: Un usuario ADMIN puede listar empleados
    Cuando consulto la lista de empleados
    Entonces la respuesta debe tener codigo 201