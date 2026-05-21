package com.empresa.notificaciones.config;

import java.io.IOException;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.empresa.notificaciones.security.JwtAuthFilter;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletResponse;

/**
 * Configuración de Spring Security.
 * Equivalente a la lógica de requiereAuth / requiereAdmin en authMiddleware.js.
 *
 * Rutas públicas (sin JWT):
 *   GET  /health
 *   GET  /api-docs/**
 *   POST /notificaciones/evento/**
 *
 * Rutas protegidas solo ADMIN:
 *   GET  /notificaciones          (lista paginada)
 *   GET  /notificaciones/estadisticas/resumen
 *
 * Rutas protegidas autenticado:
 *   GET  /notificaciones/{empleadoId}
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public AuthenticationEntryPoint restAuthenticationEntryPoint(ObjectMapper objectMapper) {
        return (request, response, authException) -> writeJsonError(
                response,
                HttpServletResponse.SC_UNAUTHORIZED,
                "Token de autenticación no proporcionado. Incluya el header Authorization: Bearer <token>",
                objectMapper
        );
    }

    @Bean
    public AccessDeniedHandler restAccessDeniedHandler(ObjectMapper objectMapper) {
        return (request, response, accessDeniedException) -> writeJsonError(
                response,
                HttpServletResponse.SC_FORBIDDEN,
                "Acceso denegado. Este endpoint requiere permisos de administrador.",
                objectMapper
        );
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           JwtAuthFilter jwtAuthFilter,
                                           AuthenticationEntryPoint restAuthenticationEntryPoint,
                                           AccessDeniedHandler restAccessDeniedHandler) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(restAuthenticationEntryPoint)
                .accessDeniedHandler(restAccessDeniedHandler)
            )
            .authorizeHttpRequests(auth -> auth
                // Rutas públicas
                .requestMatchers(HttpMethod.GET,  "/health").permitAll()
                .requestMatchers(HttpMethod.GET,  "/actuator/**").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api-docs/**").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api-docs.json").permitAll()
                .requestMatchers(HttpMethod.GET,  "/swagger-ui/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/notificaciones/evento/**").permitAll()
                // Solo ADMIN
                .requestMatchers(HttpMethod.GET,  "/notificaciones").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET,  "/notificaciones/estadisticas/resumen").hasRole("ADMIN")
                // Autenticado (cualquier rol)
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private void writeJsonError(HttpServletResponse response, int status, String message, ObjectMapper objectMapper) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(
                com.empresa.notificaciones.dto.ApiResponse.error(status, message)
        ));
    }
}
