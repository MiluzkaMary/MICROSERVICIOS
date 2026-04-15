/**
 * Servicio de Autenticación
 * Lógica de negocio para login, recuperación de contraseñas y gestión de usuarios
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuarioRepository = require('../repositories/usuarioRepository');

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-cambiar-en-produccion';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || process.env.JWT_EXPIRES_IN || '24h';
const RESET_TOKEN_EXPIRATION_SECONDS = 3600; // 1 hora

class AuthService {
  /**
   * Login de usuario
   * @param {string} email
   * @param {string} password
   * @returns {object} { token, usuario }
   */
  async login(email, password) {
    // Buscar usuario
    const usuario = await usuarioRepository.buscarPorEmail(email);
    
    if (!usuario) {
      throw { status: 401, message: 'Credenciales inválidas' };
    }

    if (!usuario.activo) {
      throw { status: 403, message: 'Usuario inactivo' };
    }

    if (!usuario.tienePassword()) {
      throw { status: 403, message: 'Debe establecer su contraseña primero usando el token de activación' };
    }

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.passwordHash);
    
    if (!passwordValida) {
      throw { status: 401, message: 'Credenciales inválidas' };
    }

    // Generar JWT con claims mínimos
    const token = jwt.sign(
      {
        sub: usuario.empleadoId,
        role: usuario.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    // Actualizar último acceso
    await usuarioRepository.actualizarUltimoAcceso(usuario.empleadoId);

    return {
      token,
      usuario: usuario.toJSON()
    };
  }

  /**
   * Solicitar recuperación de contraseña
   * @param {string} email
   * @returns {object} { mensaje, empleadoId, email }
   */
  async solicitarRecuperacion(email) {
    const usuario = await usuarioRepository.buscarPorEmail(email);
    
    if (!usuario) {
      throw { status: 404, message: 'Usuario no encontrado' };
    }

    if (!usuario.activo) {
      throw { status: 403, message: 'Usuario inactivo' };
    }

    // Generar JWT stateless de recuperación
    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      {
        sub: usuario.empleadoId,
        type: 'RESET_PASSWORD',
        iat: now,
        exp: now + RESET_TOKEN_EXPIRATION_SECONDS
      },
      JWT_SECRET
    );

    const expiracion = new Date((now + RESET_TOKEN_EXPIRATION_SECONDS) * 1000);

    // Publicar evento para que notificaciones envíe el email
    const rabbitmq = require('../config/rabbitmq');
    await rabbitmq.publish('usuario.recuperacion', {
      empleadoId: usuario.empleadoId,
      email: usuario.email,
      token: token,
      expiracion: expiracion.toISOString()
    });

    return {
      mensaje: 'Token de recuperación generado y enviado',
      empleadoId: usuario.empleadoId,
      email: usuario.email
    };
  }

  /**
   * Establecer nueva contraseña con token JWT stateless
   * @param {string} token - JWT con type: 'RESET_PASSWORD'
   * @param {string} nuevaPassword
   * @returns {object} { mensaje, empleadoId }
   */
  async resetPassword(token, nuevaPassword) {
    // Verificar y decodificar el JWT de recuperación
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw { status: 404, message: 'Token inválido o expirado' };
    }

    // Validar que sea un token de tipo RESET_PASSWORD
    if (payload.type !== 'RESET_PASSWORD') {
      throw { status: 400, message: 'Tipo de token inválido' };
    }

    // Buscar usuario por empleadoId del token
    const usuario = await usuarioRepository.buscarPorEmpleadoId(payload.sub);

    if (!usuario) {
      throw { status: 404, message: 'Usuario no encontrado' };
    }

    if (!usuario.activo) {
      throw { status: 403, message: 'Usuario inactivo' };
    }

    // Hashear nueva contraseña
    const passwordHash = await bcrypt.hash(nuevaPassword, 10);

    // Actualizar contraseña
    await usuarioRepository.establecerPassword(usuario.empleadoId, passwordHash);

    return {
      mensaje: 'Contraseña establecida correctamente',
      empleadoId: usuario.empleadoId
    };
  }

  /**
   * Manejar evento empleado.creado
   * Crea usuario y genera JWT de activación
   */
  async handleEmpleadoCreado(empleadoData, channel, exchange) {
    try {
      const { empleadoId, email, nombre } = empleadoData;

      // Verificar si ya existe
      const usuarioExistente = await usuarioRepository.buscarPorEmpleadoId(empleadoId);
      if (usuarioExistente) {
        console.log(`⚠️  Usuario ${empleadoId} ya existe, ignorando evento`);
        return;
      }

      // Crear usuario sin contraseña
      const usuario = await usuarioRepository.crear(empleadoId, email, 'USER');
      console.log(`✅ Usuario creado: ${usuario.empleadoId}`);

      // Generar JWT stateless de activación (mismo formato que recuperación)
      const now = Math.floor(Date.now() / 1000);
      const token = jwt.sign(
        {
          sub: usuario.empleadoId,
          type: 'RESET_PASSWORD',
          iat: now,
          exp: now + RESET_TOKEN_EXPIRATION_SECONDS
        },
        JWT_SECRET
      );

      const expiracion = new Date((now + RESET_TOKEN_EXPIRATION_SECONDS) * 1000);

      // Publicar evento usuario.creado con token
      const rabbitmq = require('../config/rabbitmq');
      await rabbitmq.publish('usuario.creado', {
        empleadoId: usuario.empleadoId,
        email: usuario.email,
        nombre: nombre,
        token: token,
        expiracion: expiracion.toISOString()
      });

      console.log(`📤 Evento usuario.creado publicado para ${usuario.empleadoId}`);
    } catch (error) {
      console.error('❌ Error en handleEmpleadoCreado:', error);
      throw error;
    }
  }

  /**
   * Manejar evento empleado.eliminado
   * Inhabilita usuario y expira tokens
   */
  async handleEmpleadoEliminado(empleadoData) {
    try {
      const empleadoId = empleadoData.empleadoId || empleadoData.id;

      if (!empleadoId) {
        console.warn('⚠️ Evento empleado.eliminado sin empleadoId válido', empleadoData);
        return;
      }

      const usuario = await usuarioRepository.buscarPorEmpleadoId(empleadoId);
      if (!usuario) {
        console.log(`⚠️  Usuario ${empleadoId} no existe, ignorando evento`);
        return;
      }

      // Inhabilitar usuario y limpiar tokens
      await usuarioRepository.inhabilitar(empleadoId);
      console.log(`✅ Usuario ${empleadoId} inhabilitado`);
    } catch (error) {
      console.error('❌ Error en handleEmpleadoEliminado:', error);
      throw error;
    }
  }

  /**
   * Manejar evento empleado.reactivado
   * Reactiva usuario y conserva credenciales
   */
  async handleEmpleadoReactivado(empleadoData) {
    try {
      const empleadoId = empleadoData.empleadoId || empleadoData.id;
      const email = empleadoData.email || null;

      if (!empleadoId) {
        console.warn('⚠️ Evento empleado.reactivado sin empleadoId válido', empleadoData);
        return;
      }

      const usuarioExistente = await usuarioRepository.buscarPorEmpleadoId(empleadoId);
      if (!usuarioExistente) {
        const usuarioCreado = await usuarioRepository.crear(empleadoId, email || '', 'USER');
        console.log(`✅ Usuario ${usuarioCreado.empleadoId} creado al reactivar empleado`);
        return;
      }

      const usuarioReactivado = await usuarioRepository.reactivar(empleadoId, email);
      console.log(`✅ Usuario ${usuarioReactivado.empleadoId} reactivado`);
    } catch (error) {
      console.error('❌ Error en handleEmpleadoReactivado:', error);
      throw error;
    }
  }

  /**
   * Verificar y decodificar JWT
   * @param {string} token
   * @returns {object} payload decodificado
   */
  verificarToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw { status: 401, message: 'Token inválido o expirado' };
    }
  }
}

module.exports = new AuthService();
