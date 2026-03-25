/**
 * Servicio de Autenticación
 * Lógica de negocio para login, recuperación de contraseñas y gestión de usuarios
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const usuarioRepository = require('../repositories/usuarioRepository');

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-cambiar-en-produccion';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';
const TOKEN_RECOVERY_EXPIRATION_HOURS = 1;

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
        role: usuario.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 horas
      },
      JWT_SECRET
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

    // Generar token de recuperación (UUID v4 simple)
    const token = crypto.randomUUID();
    const expiracion = new Date();
    expiracion.setHours(expiracion.getHours() + TOKEN_RECOVERY_EXPIRATION_HOURS);

    // Guardar token en BD
    await usuarioRepository.establecerTokenRecuperacion(
      usuario.empleadoId,
      token,
      expiracion
    );

    // Publicar evento para que notificaciones envíe el email
    // DECISIÓN MÍNIMA PROPUESTA: Usar RabbitMQ para desacoplar envío de emails
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
   * Establecer nueva contraseña con token
   * @param {string} token
   * @param {string} nuevaPassword
   * @returns {object} { mensaje, empleadoId }
   */
  async resetPassword(token, nuevaPassword) {
    // Buscar usuario por token
    const usuario = await usuarioRepository.buscarPorToken(token);
    
    if (!usuario) {
      throw { status: 404, message: 'Token inválido o expirado' };
    }

    if (!usuario.tokenRecuperacionValido()) {
      throw { status: 400, message: 'Token expirado' };
    }

    if (!usuario.activo) {
      throw { status: 403, message: 'Usuario inactivo' };
    }

    // Hashear nueva contraseña
    const passwordHash = await bcrypt.hash(nuevaPassword, 10);

    // Actualizar contraseña y limpiar token
    await usuarioRepository.establecerPassword(usuario.empleadoId, passwordHash);

    return {
      mensaje: 'Contraseña establecida correctamente',
      empleadoId: usuario.empleadoId
    };
  }

  /**
   * Manejar evento empleado.creado
   * Crea usuario inactivo con token de activación
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

      // Generar token de activación
      const token = crypto.randomUUID();
      const expiracion = new Date();
      expiracion.setHours(expiracion.getHours() + TOKEN_RECOVERY_EXPIRATION_HOURS);

      await usuarioRepository.establecerTokenRecuperacion(
        usuario.empleadoId,
        token,
        expiracion
      );

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
