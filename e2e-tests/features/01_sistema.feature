# language: es
Característica: Sistema
  Como equipo de desarrollo
  Quiero una verificacion rapida del sistema expuesto por el gateway
  Para detectar roturas basicas de integracion.

  Escenario: El gateway rechaza un login invalido de forma controlada
    Cuando intento iniciar sesion por el gateway con credenciales invalidas
    Entonces la respuesta debe tener codigo 401

  @necesita-admin
  Escenario: Un administrador puede consultar empleados a traves del gateway
    Cuando consulto la lista de empleados
    Entonces la respuesta debe tener codigo 201