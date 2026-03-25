/**
 * Configuración de Nodemailer para envío de emails
 */
const nodemailer = require('nodemailer');

/**
 * Configuración del transporter de Nodemailer
 * Por defecto usa Mailhog para desarrollo local
 */
const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST || 'mailhog',
    port: parseInt(process.env.SMTP_PORT || '1025', 10),
    secure: false, // true para puerto 465, false para otros
    // auth se puede agregar para SMTP real
    // auth: {
    //   user: process.env.SMTP_USER,
    //   pass: process.env.SMTP_PASS
    // }
  };

  const transporter = nodemailer.createTransport(config);

  // Verificar configuración
  transporter.verify((error, success) => {
    if (error) {
      console.warn('⚠️ SMTP no disponible:', error.message);
      console.log('📧 Las notificaciones se registrarán pero no se enviarán por email');
    } else {
      console.log('✅ SMTP configurado correctamente - Servidor listo para enviar emails');
    }
  });

  return transporter;
};

module.exports = { createTransporter };
