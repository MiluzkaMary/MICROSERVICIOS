package com.empresa.notificaciones.controller;

import com.empresa.notificaciones.config.AppConfig;
import com.empresa.notificaciones.config.OpenApiConfig;
import com.empresa.notificaciones.config.SecurityConfig;
import com.empresa.notificaciones.security.JwtUtil;
import com.empresa.notificaciones.service.NotificacionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.SecretKey;
import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {HealthController.class, NotificacionController.class, ApiDocsController.class})
@Import({AppConfig.class, OpenApiConfig.class, SecurityConfig.class, JwtUtil.class})
@TestPropertySource(properties = {
        "app.jwt.secret=test-secret-key-para-pruebas-unitarias-32b",
        "spring.main.allow-bean-definition-overriding=true"
})
class NotificacionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private NotificacionService service;

    private String token(String subject, String role) {
        SecretKey key = Keys.hmacShaKeyFor("test-secret-key-para-pruebas-unitarias-32b".getBytes());
        return Jwts.builder()
                .subject(subject)
                .claim("role", role)
                .signWith(key)
                .compact();
    }

    @Test
    void healthShouldBePublic() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("notificaciones-service"));
    }

    @Test
    void docsJsonShouldBePublic() throws Exception {
        mockMvc.perform(get("/api-docs.json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("API Notificaciones"));
    }

    @Test
    void listShouldRejectWithoutToken() throws Exception {
        mockMvc.perform(get("/notificaciones"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Token de autenticación no proporcionado. Incluya el header Authorization: Bearer <token>"));
    }

    @Test
    void listShouldRejectUserRole() throws Exception {
        mockMvc.perform(get("/notificaciones").header("Authorization", "Bearer " + token("E001", "USER")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void listShouldAllowAdminRole() throws Exception {
        var page = new com.empresa.notificaciones.dto.PaginatedResponse<com.empresa.notificaciones.dto.NotificacionDTO>();
        page.setPage(1);
        page.setSize(10);
        page.setTotalRecords(0);
        page.setTotalPages(0);
        page.setItems(List.of());
        when(service.obtenerConPaginacion(1, 10, "fechaEnvio", "DESC", null, null, null, null, null))
            .thenReturn(page);

        mockMvc.perform(get("/notificaciones").header("Authorization", "Bearer " + token("E001", "ADMIN")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.page").value(1))
            .andExpect(jsonPath("$.data.items").isArray());
    }

    @Test
    void eventEmpleadoCreadoShouldBePublicAndCallService() throws Exception {
        var dto = new com.empresa.notificaciones.dto.EventoEmpleadoCreadoRequest();
        dto.setEmpleadoId("E001");
        dto.setNombre("Juan");
        dto.setEmail("juan@empresa.com");

        var respuesta = new com.empresa.notificaciones.dto.NotificacionDTO();
        respuesta.setId(1L);
        respuesta.setEmpleadoId("E001");
        respuesta.setTipo("BIENVENIDA");
        when(service.procesarEmpleadoCreado("E001", "Juan", "juan@empresa.com")).thenReturn(respuesta);

        mockMvc.perform(post("/notificaciones/evento/empleado-creado")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Notificación de bienvenida procesada"));

        verify(service).procesarEmpleadoCreado("E001", "Juan", "juan@empresa.com");
    }
}