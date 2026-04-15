# language: es
@necesita-admin
Característica: Onboarding
  Como area de recursos humanos
  Quiero automatizar el alta de empleados
  Para validar el flujo completo de creacion, activacion y acceso.

  Escenario: Registro exitoso con verificacion asincronica de credenciales
    Cuando creo un empleado de onboarding
    Entonces eventualmente el servicio de auth debe tener un usuario para el empleado creado

  Escenario: Registro exitoso con verificacion asincronica de notificacion
    Cuando creo un empleado de onboarding
    Entonces eventualmente debe existir una notificacion para el empleado creado

  Escenario: El nuevo empleado puede hacer login
    Cuando creo un empleado de onboarding
    Y eventualmente el servicio de auth debe tener un usuario para el empleado creado
    Y solicito la recuperacion de contraseña para el empleado creado
    Y eventualmente debo obtener el token de recuperacion del empleado creado
    Y restablezco la contraseña del empleado creado
    Entonces el empleado puede iniciar sesion correctamente

  Escenario: Registro con departamento inexistente
    Cuando intento crear un empleado con departamento inexistente
    Entonces la respuesta debe tener codigo 400

  Esquema del escenario: Registro con campos faltantes
    Cuando intento crear un empleado con nombre "<nombre>", email "<email>", departamentoId "<departamentoId>" y fechaIngreso "<fechaIngreso>"
    Entonces la respuesta debe tener codigo 400

    Ejemplos:
      | nombre | email | departamentoId | fechaIngreso |
      |        | test@empresa.com | 1 | 2026-01-01 |
      | Juan   |       | 1 | 2026-01-01 |
      | Juan   | test@empresa.com |  | 2026-01-01 |
      | Juan   | test@empresa.com | 1 |            |