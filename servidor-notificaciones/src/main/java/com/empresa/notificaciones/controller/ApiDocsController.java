package com.empresa.notificaciones.controller;

import io.swagger.v3.oas.models.OpenAPI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ApiDocsController {

    private final OpenAPI openAPI;

    public ApiDocsController(OpenAPI openAPI) {
        this.openAPI = openAPI;
    }

    @GetMapping("/api-docs.json")
    public ResponseEntity<OpenAPI> apiDocsJson() {
        return ResponseEntity.ok(openAPI);
    }
}