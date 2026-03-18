# Message Broker RabbitMQ

## Exchange

- Nombre: empleados_events
- Tipo: topic

## Routing keys implementadas

- empleado.creado
- empleado.eliminado
- usuario.creado
- usuario.recuperacion

## Eventos y publicadores

empleado.creado
- Publica: servidor-empleados

empleado.eliminado
- Publica: servidor-empleados

usuario.creado
- Publica: servidor-auth

usuario.recuperacion
- Publica: servidor-auth

## Consumidores por evento

empleado.creado
- servidor-auth (cola auth.empleado_creado)
- servidor-perfiles (cola perfiles.empleado_creado)
- servidor-notificaciones (cola notificaciones.empleado_creado)

empleado.eliminado
- servidor-auth (cola auth.empleado_eliminado)
- servidor-perfiles (cola perfiles.empleado_eliminado)
- servidor-notificaciones (cola notificaciones.empleado_eliminado)

usuario.creado
- servidor-notificaciones (cola notificaciones.usuario_creado)

usuario.recuperacion
- servidor-notificaciones (cola notificaciones.usuario_recuperacion)

## Flujo completo de eventos

### Creacion de empleado

1. servidor-empleados crea el registro y publica empleado.creado.
2. servidor-auth consume empleado.creado, crea usuario en auth_db y publica usuario.creado.
3. servidor-perfiles consume empleado.creado y crea perfil.
4. servidor-notificaciones consume empleado.creado y usuario.creado para registrar/enviar notificaciones de bienvenida y activacion.

### Eliminacion de empleado

1. servidor-empleados elimina el registro y publica empleado.eliminado.
2. servidor-auth consume empleado.eliminado y desactiva el usuario.
3. servidor-perfiles consume empleado.eliminado y elimina el perfil.
4. servidor-notificaciones consume empleado.eliminado y genera notificacion de desvinculacion.

### Recuperacion de password

1. Cliente llama POST /auth/recover-password.
2. servidor-auth genera token y publica usuario.recuperacion.
3. servidor-notificaciones consume usuario.recuperacion y envia correo de recuperacion.
