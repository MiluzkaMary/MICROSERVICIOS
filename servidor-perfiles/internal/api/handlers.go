package api

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"servidor-perfiles/internal/domain"
	"servidor-perfiles/internal/validation"
)

type Handler struct {
	service PerfilService
}

func NewHandler(service PerfilService) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"status": "UP", "timestamp": time.Now().UTC().Format(time.RFC3339), "service": "perfiles-service", "version": "1.0.0"})
}

func (h *Handler) APIDocs(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"title": "API de Gestión de Perfiles de Empleados", "version": "1.0.0", "routes": []string{"GET /perfiles", "GET /perfiles/{empleadoId}", "PUT /perfiles/{empleadoId}", "POST /perfiles/evento/empleado-creado", "GET /health"}, "service": "perfiles-service", "swagger": "migrated-to-go", "path": r.URL.Path})
}

func (h *Handler) APIDocsJSON(w http.ResponseWriter, r *http.Request) {
	h.APIDocs(w, r)
}

func (h *Handler) ListarPerfiles(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	page, _ := strconv.Atoi(defaultString(query.Get("page"), "1"))
	size, _ := strconv.Atoi(defaultString(query.Get("size"), "10"))
	result := h.service.ListProfiles(r.Context(), domain.ListOptions{Page: page, Size: size, SortBy: query.Get("sortBy"), Order: query.Get("order"), Q: query.Get("q"), Nombre: query.Get("nombre"), Email: query.Get("email"), Ciudad: query.Get("ciudad")})
	writeJSON(w, result.StatusCode, result)
}

func (h *Handler) ObtenerPerfil(w http.ResponseWriter, r *http.Request) {
	empleadoID := chi.URLParam(r, "empleadoId")
	if errores := validation.ValidarEmpleadoID(empleadoID); len(errores) > 0 {
		writeJSON(w, http.StatusBadRequest, domain.APIResponse{Success: false, StatusCode: 400, Message: "Datos inválidos", Errors: errores})
		return
	}
	result := h.service.GetProfile(r.Context(), empleadoID)
	writeJSON(w, result.StatusCode, result)
}

func (h *Handler) ActualizarPerfil(w http.ResponseWriter, r *http.Request) {
	empleadoID := chi.URLParam(r, "empleadoId")
	if errores := validation.ValidarEmpleadoID(empleadoID); len(errores) > 0 {
		writeJSON(w, http.StatusBadRequest, domain.APIResponse{Success: false, StatusCode: 400, Message: "empleadoId inválido", Errors: errores})
		return
	}

	var input domain.PerfilInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, domain.APIResponse{Success: false, StatusCode: 400, Message: "Datos inválidos", Errors: []string{"JSON inválido"}})
		return
	}

	errores := validation.ValidarActualizacion(map[string]any{"telefono": input.Telefono, "direccion": input.Direccion, "ciudad": input.Ciudad, "biografia": input.Biografia})
	if len(errores) > 0 {
		writeJSON(w, http.StatusBadRequest, domain.APIResponse{Success: false, StatusCode: 400, Message: "Datos inválidos", Errors: errores})
		return
	}

	result := h.service.UpdateProfile(r.Context(), empleadoID, input)
	writeJSON(w, result.StatusCode, result)
}

func (h *Handler) ManejarEmpleadoCreado(w http.ResponseWriter, r *http.Request) {
	var event domain.EventoEmpleadoCreado
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		writeJSON(w, http.StatusBadRequest, domain.APIResponse{Success: false, StatusCode: 400, Message: "Datos del evento inválidos", Errors: []string{"JSON inválido"}})
		return
	}
	result := h.service.CreateProfileFromEvent(r.Context(), event)
	writeJSON(w, result.StatusCode, result)
}

func writeJSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}

func defaultString(value, fallback string) string {
	if strings.TrimSpace(value) == "" {
		return fallback
	}
	return value
}
