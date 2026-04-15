# language: es
@necesita-admin
Característica: Offboarding
  Como area de recursos humanos
  Quiero validar la desvinculacion de empleados
  Para asegurar que la inactivacion se propague a todo el sistema.

  Antecedentes:
    Dado que existe un empleado activo con credenciales configuradas

  Escenario: Desvinculacion completa
    Cuando el administrador desvincula al empleado
    Entonces eventualmente debe existir una notificacion de desvinculacion

  Escenario: Empleado desvinculado no puede hacer login
    Cuando el administrador desvincula al empleado
    Y el empleado intenta hacer login
    Entonces la respuesta debe tener codigo 403

  Escenario: Recuperacion de contraseña falla para empleado desvinculado
    Cuando el administrador desvincula al empleado
    Y solicito recuperacion de contraseña para el empleado desvinculado
    Entonces la respuesta debe tener codigo 403