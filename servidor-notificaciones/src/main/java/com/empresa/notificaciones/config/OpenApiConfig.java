package com.empresa.notificaciones.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de SpringDoc OpenAPI (Swagger UI).
 * Equivalente a src/config/swagger.js.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("API Notificaciones")
                        .version("1.0.0")
                        .description("""
                                Microservicio de Notificaciones — Sistema de Gestión de Empleados.
                                
                                Gestiona el envío y registro de notificaciones vía email ante eventos del sistema
                                (bienvenida, desvinculación, activación y recuperación de contraseña).
                                Consume eventos de RabbitMQ publicados por otros microservicios.
                                """)
                        .contact(new Contact()
                                .name("Equipo de Recursos Humanos")
                                .email("rh@empresa.com")))
                .addSecurityItem(new SecurityRequirement().addList("BearerAuth"))
                .components(new Components()
                        .addSecuritySchemes("BearerAuth", new SecurityScheme()
                                .name("BearerAuth")
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Introduce el JWT obtenido del servicio de autenticación")));
    }
}
