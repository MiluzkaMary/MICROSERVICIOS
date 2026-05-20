package com.empresa.notificaciones.exception;

import java.lang.reflect.Method;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.servlet.NoHandlerFoundException;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void shouldMapValidationErrorsToBadRequest() throws Exception {
        Method method = TestPayloadController.class.getDeclaredMethod("valid", ValidationRequest.class);
        MethodParameter methodParameter = new MethodParameter(method, 0);
        BindingResult bindingResult = new BeanPropertyBindingResult(new ValidationRequest(), "validationRequest");
        bindingResult.addError(new FieldError("validationRequest", "nombre", "no debe estar vacío"));

        MethodArgumentNotValidException exception = new MethodArgumentNotValidException(methodParameter, bindingResult);

        ResponseEntity<Map<String, Object>> response = handler.handleValidation(exception);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertFalse((Boolean) response.getBody().get("success"));
        assertEquals(400, response.getBody().get("statusCode"));
        assertEquals("Datos inválidos", response.getBody().get("message"));
        assertEquals("nombre: no debe estar vacío", ((java.util.List<?>) response.getBody().get("errors")).get(0));
    }

    @Test
    void shouldMapMissingRouteToNotFound() {
        NoHandlerFoundException exception = new NoHandlerFoundException("GET", "/ruta-que-no-existe", null);

        ResponseEntity<Map<String, Object>> response = handler.handleNotFound(exception);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertFalse((Boolean) response.getBody().get("success"));
        assertEquals(404, response.getBody().get("statusCode"));
        assertEquals("Ruta no encontrada: /ruta-que-no-existe", response.getBody().get("message"));
    }

    @Test
    void shouldMapUnexpectedErrorsToInternalServerError() {
        ResponseEntity<Map<String, Object>> response = handler.handleGeneral(new IllegalStateException("boom"));

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertFalse((Boolean) response.getBody().get("success"));
        assertEquals(500, response.getBody().get("statusCode"));
        assertEquals("Error interno del servidor", response.getBody().get("message"));
    }

    private static class TestPayloadController {

        public void valid(ValidationRequest request) {
            // Only used to build a MethodParameter for the validation exception.
        }
    }

    private static class ValidationRequest {

        private String nombre;

        public String getNombre() {
            return nombre;
        }

        public void setNombre(String nombre) {
            this.nombre = nombre;
        }
    }
}