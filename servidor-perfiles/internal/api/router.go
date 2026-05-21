package api

import (
	"context"
	"net/http"

	"github.com/go-chi/chi/v5"

	"servidor-perfiles/internal/domain"
)

type PerfilService interface {
	ListProfiles(rctx context.Context, options domain.ListOptions) domain.APIResponse
	GetProfile(rctx context.Context, empleadoID string) domain.APIResponse
	UpdateProfile(rctx context.Context, empleadoID string, input domain.PerfilInput) domain.APIResponse
	CreateProfileFromEvent(rctx context.Context, event domain.EventoEmpleadoCreado) domain.APIResponse
	DeactivateProfile(rctx context.Context, empleadoID string) domain.APIResponse
	ReactivateProfile(rctx context.Context, empleadoID string) domain.APIResponse
}

func NewRouter(perfilService PerfilService, jwtSecret string) http.Handler {
	r := chi.NewRouter()
	handler := NewHandler(perfilService)
	r.Use(MetricsMiddleware())

	r.Get("/health", handler.Health)
	r.Get("/metrics", MetricsHandler)
	r.Get("/api-docs", handler.APIDocs)
	r.Get("/api-docs.json", handler.APIDocsJSON)
	r.With(RequiereAuth(jwtSecret)).Get("/perfiles", handler.ListarPerfiles)
	r.With(RequiereAuth(jwtSecret)).Get("/perfiles/", handler.ListarPerfiles)
	r.With(RequiereAuth(jwtSecret)).Get("/perfiles/{empleadoId}", handler.ObtenerPerfil)
	r.With(RequiereAuth(jwtSecret)).Put("/perfiles/{empleadoId}", handler.ActualizarPerfil)
	r.Post("/perfiles/evento/empleado-creado", handler.ManejarEmpleadoCreado)

	return r
}
