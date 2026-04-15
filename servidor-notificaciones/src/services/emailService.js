/**
 * Servicio de Email usando Nodemailer
 */
const { createTransporter } = require('../config/email');

// URL del servicio de autenticación (parametrizable)
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8084';

class EmailService {
  constructor() {
    this.transporter = null;
    this.smtpDisponible = false;
    this.inicializar();
  }

  /**
   * Inicializa el transporter de email
   */
  inicializar() {
    try {
      this.transporter = createTransporter();
      this.smtpDisponible = true;
    } catch (error) {
      console.warn('⚠️ No se pudo inicializar el servicio de email:', error.message);
      this.smtpDisponible = false;
    }
  }

  /**
   * Envía un email
   */
  async enviarEmail(destinatario, asunto, mensaje) {
    if (!this.smtpDisponible || !this.transporter) {
      console.log(`📧 [SIMULADO] Email a ${destinatario}: ${asunto}`);
      return { success: true, simulado: true };
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || '"Sistema RH" <rh@empresa.com>',
        to: destinatario,
        subject: asunto,
        text: mensaje,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                 <h2 style="color: #333;">${asunto}</h2>
                 <p style="color: #555; line-height: 1.6;">${mensaje}</p>
                 <hr style="border: 1px solid #eee; margin: 20px 0;">
                 <p style="color: #888; font-size: 12px;">Este es un mensaje automático del Sistema de Recursos Humanos</p>
               </div>`
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email enviado: ${info.messageId} a ${destinatario}`);
      return { success: true, messageId: info.messageId };

    } catch (error) {
      console.error(`❌ Error al enviar email a ${destinatario}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envía notificación de bienvenida
   */
  async enviarBienvenida(nombre, email, empleadoId) {
    const asunto = `¡Bienvenido a la empresa ${nombre}!`;
    const mensaje = `¡Bienvenido a la empresa ${nombre}! 

Estamos emocionados de tenerte en el equipo. 

Tu ID de empleado es: ${empleadoId}

Pronto recibirás más información sobre tu onboarding y los siguientes pasos.

¡Bienvenido!

Equipo de Recursos Humanos`;

    return await this.enviarEmail(email, asunto, mensaje);
  }

  /**
   * Envía email de activación de cuenta con token
   */
  async enviarEmailActivacion(nombre, email, empleadoId, token) {
    const asunto = '🔐 Activa tu cuenta - Sistema de Empleados';
    const mensaje = `Hola ${nombre || empleadoId},

Tu cuenta ha sido creada exitosamente.

Para activar tu cuenta y establecer tu contraseña, usa el siguiente token:

Token: ${token}

Este token expira en 24 horas.

Endpoint: POST ${AUTH_SERVICE_URL}/auth/reset-password
Body: {
  "token": "${token}",
  "nuevaPassword": "TuNuevaPassword123"
}

Saludos,
Equipo de Recursos Humanos`;

    return await this.enviarEmail(email, asunto, mensaje);
  }

  /**
   * Envía notificación de desvinculación
   */
  async enviarDesvinculacion(nombre, email, empleadoId, motivo = '') {
    const asunto = 'Finalización de relación laboral';
    const mensajeMotivo = motivo ? `\nMotivo: ${motivo}\n` : '';
    const mensaje = `Estimado/a ${nombre},

Lamentamos informarte que tu relación laboral con la empresa ha sido desactivada.
${mensajeMotivo}
Tu ID de empleado ${empleadoId} quedará inactivo temporalmente.

Te deseamos lo mejor en tus futuros proyectos.

Equipo de Recursos Humanos`;

    return await this.enviarEmail(email, asunto, mensaje);
  }

  /**
   * Envía correo de vinculación tras reactivación
   */
  async enviarVinculacion(nombre, email, empleadoId) {
    const asunto = 'Tu relación laboral ha sido reactivada';
    const mensaje = `Hola ${nombre || empleadoId},

Tu cuenta y tu perfil han sido reactivados correctamente.

Tu ID de empleado sigue siendo: ${empleadoId}

Ya puedes volver a usar tus credenciales habituales para acceder al sistema.

Saludos,
Equipo de Recursos Humanos`;

    return await this.enviarEmail(email, asunto, mensaje);
  }

  /**
   * Envía email de recuperación de contraseña con token
   */
  async enviarEmailRecuperacion(email, empleadoId, token) {
    const asunto = '🔑 Recuperación de Contraseña - Sistema de Empleados';
    const mensaje = `Hola,

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta (${empleadoId}).

Para restablecer tu contraseña, usa el siguiente token:

Token: ${token}

Este token expira en 24 horas.

Endpoint: POST ${AUTH_SERVICE_URL}/auth/reset-password
Body: {
  "token": "${token}",
  "nuevaPassword": "TuNuevaPassword123"
}

Si no solicitaste este cambio, ignora este mensaje.

Saludos,
Equipo de Recursos Humanos`;

    return await this.enviarEmail(email, asunto, mensaje);
  }
}

module.exports = new EmailService();
