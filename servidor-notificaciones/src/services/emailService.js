/**
 * Servicio de Email usando Nodemailer
 */
const { createTransporter } = require('../config/email');

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
   * Envía notificación de desvinculación
   */
  async enviarDesvinculacion(nombre, email, empleadoId, motivo = '') {
    const asunto = 'Finalización de relación laboral';
    const mensajeMotivo = motivo ? `\nMotivo: ${motivo}\n` : '';
    const mensaje = `Estimado/a ${nombre},

Lamentamos informarte que tu relación laboral con la empresa ha finalizado.
${mensajeMotivo}
Tu ID de empleado ${empleadoId} quedará inactivo.

Te deseamos lo mejor en tus futuros proyectos.

Equipo de Recursos Humanos`;

    return await this.enviarEmail(email, asunto, mensaje);
  }
}

module.exports = new EmailService();
