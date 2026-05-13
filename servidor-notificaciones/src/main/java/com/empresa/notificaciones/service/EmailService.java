package com.empresa.notificaciones.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Value("${app.smtp.from:\"Sistema RH\" <rh@empresa.com>}")
    private String from;

    @Value("${app.auth.service-url:http://localhost:8084}")
    private String authServiceUrl;

    public boolean enviarEmail(String destinatario, String asunto, String mensaje) {
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setFrom(from);
            mail.setTo(destinatario);
            mail.setSubject(asunto);
            mail.setText(mensaje);
            mailSender.send(mail);
            log.info("✅ Email enviado a {}", destinatario);
            return true;
        } catch (MailException e) {
            log.warn("⚠️ No se pudo enviar email a {}: {}", destinatario, e.getMessage());
            return false;
        }
    }

    public boolean enviarBienvenida(String nombre, String email, String empleadoId) {
        String asunto = "¡Bienvenido a la empresa " + nombre + "!";
        String mensaje = String.format("""
                ¡Bienvenido a la empresa %s!

                Estamos emocionados de tenerte en el equipo.
                Tu ID de empleado es: %s

                Pronto recibirás más información sobre tu onboarding.

                Equipo de Recursos Humanos""", nombre, empleadoId);
        return enviarEmail(email, asunto, mensaje);
    }

    public boolean enviarDesvinculacion(String nombre, String email, String empleadoId, String motivo) {
        String asunto = "Finalización de relación laboral";
        String mensajeMotivo = (motivo != null && !motivo.isBlank()) ? "\nMotivo: " + motivo + "\n" : "";
        String mensaje = String.format("""
                Estimado/a %s,

                Lamentamos informarte que tu relación laboral con la empresa ha sido desactivada.%s
                Tu ID de empleado %s quedará inactivo temporalmente.

                Te deseamos lo mejor en tus futuros proyectos.

                Equipo de Recursos Humanos""", nombre, mensajeMotivo, empleadoId);
        return enviarEmail(email, asunto, mensaje);
    }

    public boolean enviarVinculacion(String nombre, String email, String empleadoId) {
        String asunto = "Tu relación laboral ha sido reactivada";
        String mensaje = String.format("""
                Hola %s,

                Tu cuenta y tu perfil han sido reactivados correctamente.
                Tu ID de empleado sigue siendo: %s

                Ya puedes volver a usar tus credenciales habituales.

                Equipo de Recursos Humanos""", nombre != null ? nombre : empleadoId, empleadoId);
        return enviarEmail(email, asunto, mensaje);
    }

    public boolean enviarActivacion(String nombre, String email, String empleadoId, String token) {
        String asunto = "🔐 Activa tu cuenta - Sistema de Empleados";
        String mensaje = String.format("""
                Hola %s,

                Tu cuenta ha sido creada exitosamente.
                Para activar tu cuenta usa el siguiente token:

                Token: %s

                Este token expira en 24 horas.

                Endpoint: POST %s/auth/reset-password
                Body: { "token": "%s", "nuevaPassword": "TuNuevaPassword123" }

                Equipo de Recursos Humanos""",
                nombre != null ? nombre : empleadoId, token, authServiceUrl, token);
        return enviarEmail(email, asunto, mensaje);
    }

    public boolean enviarRecuperacion(String email, String empleadoId, String token) {
        String asunto = "🔑 Recuperación de Contraseña - Sistema de Empleados";
        String mensaje = String.format("""
                Hola,

                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta (%s).
                Usa el siguiente token:

                Token: %s

                Este token expira en 24 horas.

                Endpoint: POST %s/auth/reset-password
                Body: { "token": "%s", "nuevaPassword": "TuNuevaPassword123" }

                Si no solicitaste este cambio, ignora este mensaje.

                Equipo de Recursos Humanos""", empleadoId, token, authServiceUrl, token);
        return enviarEmail(email, asunto, mensaje);
    }
}
