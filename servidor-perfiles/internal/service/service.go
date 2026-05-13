package service

import (
	"context"
	"fmt"
	"strings"

	"servidor-perfiles/internal/domain"
	"servidor-perfiles/internal/repository"
	"servidor-perfiles/internal/validation"
)

type Repository interface {
	FindByEmpleadoID(context.Context, string) (*domain.Perfil, error)
	FindAll(context.Context) ([]domain.Perfil, error)
	FindPaginated(context.Context, domain.ListOptions) (repository.PageResult, error)
	Create(context.Context, domain.Perfil) (*domain.Perfil, error)
	UpdateByEmpleadoID(context.Context, string, domain.Perfil) (*domain.Perfil, error)
	DeactivateByEmpleadoID(context.Context, string) (*domain.Perfil, error)
	ReactivateByEmpleadoID(context.Context, string) (*domain.Perfil, error)
	ExistsByEmpleadoID(context.Context, string) (bool, error)
	ExistsByEmail(context.Context, string) (bool, error)
}

type PerfilService struct {
	repo Repository
}

func NewPerfilService(repo Repository) *PerfilService {
	return &PerfilService{repo: repo}
}

func (s *PerfilService) GetProfile(ctx context.Context, empleadoID string) domain.APIResponse {
	perfil, err := s.repo.FindByEmpleadoID(ctx, empleadoID)
	if err != nil {
		return internalErrorResponse("Error al obtener el perfil", err)
	}
	if perfil == nil {
		return domain.APIResponse{Success: false, StatusCode: 404, Message: "Perfil no encontrado", Errors: []string{fmt.Sprintf("No existe un perfil para el empleado con id %s", empleadoID)}}
	}
	return domain.APIResponse{Success: true, StatusCode: 200, Data: perfil}
}

func (s *PerfilService) ListProfiles(ctx context.Context, options domain.ListOptions) domain.APIResponse {
	options.Page = normalizeMin(options.Page, 1)
	if options.Size <= 0 {
		options.Size = 10
	}
	if options.Size > 100 {
		options.Size = 100
	}
	options.SortBy = strings.TrimSpace(options.SortBy)
	if options.SortBy == "" {
		options.SortBy = "fecha_creacion"
	}
	options.Order = strings.TrimSpace(options.Order)
	if options.Order == "" {
		options.Order = "DESC"
	}
	options.Q = normalizeFilter(options.Q)
	options.Nombre = normalizeFilter(options.Nombre)
	options.Email = normalizeFilter(options.Email)
	options.Ciudad = normalizeFilter(options.Ciudad)

	pageResult, err := s.repo.FindPaginated(ctx, options)
	if err != nil {
		return internalErrorResponse("Error interno al obtener los perfiles", err)
	}

	return domain.APIResponse{Success: true, StatusCode: 200, Data: domain.ListPage{Page: pageResult.Page, Size: pageResult.Size, TotalRecords: pageResult.TotalRecords, TotalPages: pageResult.TotalPages, Items: pageResult.Items}}
}

func (s *PerfilService) UpdateProfile(ctx context.Context, empleadoID string, input domain.PerfilInput) domain.APIResponse {
	exists, err := s.repo.ExistsByEmpleadoID(ctx, empleadoID)
	if err != nil {
		return internalErrorResponse("Error al actualizar el perfil", err)
	}
	if !exists {
		return domain.APIResponse{Success: false, StatusCode: 404, Message: "Perfil no encontrado", Errors: []string{fmt.Sprintf("No existe un perfil para el empleado con id %s", empleadoID)}}
	}

	updated, err := s.repo.UpdateByEmpleadoID(ctx, empleadoID, domain.Perfil{Telefono: strings.TrimSpace(input.Telefono), Direccion: strings.TrimSpace(input.Direccion), Ciudad: strings.TrimSpace(input.Ciudad), Biografia: strings.TrimSpace(input.Biografia)})
	if err != nil {
		return internalErrorResponse("Error al actualizar el perfil", err)
	}

	return domain.APIResponse{Success: true, StatusCode: 200, Message: "Perfil actualizado exitosamente", Data: updated}
}

func (s *PerfilService) CreateProfileFromEvent(ctx context.Context, event domain.EventoEmpleadoCreado) domain.APIResponse {
	errores := validation.ValidarCreacionDefault(event.EmpleadoID, event.Nombre, event.Email)
	if len(errores) > 0 {
		return domain.APIResponse{Success: false, StatusCode: 400, Message: "Datos del evento inválidos", Errors: errores}
	}

	exists, err := s.repo.ExistsByEmpleadoID(ctx, event.EmpleadoID)
	if err != nil {
		return internalErrorResponse("Error al crear el perfil", err)
	}
	if exists {
		return domain.APIResponse{Success: false, StatusCode: 409, Message: fmt.Sprintf("Ya existe un perfil para el empleado %s", event.EmpleadoID), Errors: []string{"Perfil duplicado"}}
	}

	emailInUse, err := s.repo.ExistsByEmail(ctx, event.Email)
	if err != nil {
		return internalErrorResponse("Error al crear el perfil", err)
	}
	if emailInUse {
		return domain.APIResponse{Success: false, StatusCode: 409, Message: fmt.Sprintf("El email %s ya está registrado", event.Email), Errors: []string{"Email duplicado"}}
	}

	perfil, err := s.repo.Create(ctx, domain.Perfil{EmpleadoID: event.EmpleadoID, Nombre: strings.TrimSpace(event.Nombre), Email: strings.TrimSpace(event.Email), Activo: true})
	if err != nil {
		return internalErrorResponse("Error al crear el perfil", err)
	}

	return domain.APIResponse{Success: true, StatusCode: 201, Message: "Perfil creado exitosamente", Data: perfil}
}

func (s *PerfilService) DeactivateProfile(ctx context.Context, empleadoID string) domain.APIResponse {
	perfil, err := s.repo.FindByEmpleadoID(ctx, empleadoID)
	if err != nil {
		return internalErrorResponse("Error al desactivar el perfil", err)
	}
	if perfil == nil {
		return domain.APIResponse{Success: false, StatusCode: 404, Message: fmt.Sprintf("No existe un perfil para el empleado %s", empleadoID), Errors: []string{"Perfil no encontrado"}}
	}
	if !perfil.Activo {
		return domain.APIResponse{Success: true, StatusCode: 200, Message: fmt.Sprintf("El perfil del empleado %s ya estaba desactivado", empleadoID), Data: perfil}
	}

	updated, err := s.repo.DeactivateByEmpleadoID(ctx, empleadoID)
	if err != nil {
		return internalErrorResponse("Error al desactivar el perfil", err)
	}
	return domain.APIResponse{Success: true, StatusCode: 200, Message: fmt.Sprintf("Perfil del empleado %s desactivado exitosamente", empleadoID), Data: updated}
}

func (s *PerfilService) ReactivateProfile(ctx context.Context, empleadoID string) domain.APIResponse {
	perfil, err := s.repo.FindByEmpleadoID(ctx, empleadoID)
	if err != nil {
		return internalErrorResponse("Error al reactivar el perfil", err)
	}
	if perfil == nil {
		return domain.APIResponse{Success: false, StatusCode: 404, Message: fmt.Sprintf("No existe un perfil para el empleado %s", empleadoID), Errors: []string{"Perfil no encontrado"}}
	}
	if perfil.Activo {
		return domain.APIResponse{Success: true, StatusCode: 200, Message: fmt.Sprintf("El perfil del empleado %s ya estaba activo", empleadoID), Data: perfil}
	}

	updated, err := s.repo.ReactivateByEmpleadoID(ctx, empleadoID)
	if err != nil {
		return internalErrorResponse("Error al reactivar el perfil", err)
	}
	return domain.APIResponse{Success: true, StatusCode: 200, Message: fmt.Sprintf("Perfil del empleado %s reactivado exitosamente", empleadoID), Data: updated}
}

func (s *PerfilService) AllProfiles(ctx context.Context) domain.APIResponse {
	profiles, err := s.repo.FindAll(ctx)
	if err != nil {
		return internalErrorResponse("Error al listar perfiles", err)
	}
	return domain.APIResponse{Success: true, StatusCode: 200, Data: profiles, Total: len(profiles)}
}

func normalizeFilter(value string) string {
	return strings.TrimSpace(strings.ToLower(value))
}

func normalizeMin(value, fallback int) int {
	if value < fallback {
		return fallback
	}
	return value
}

func internalErrorResponse(message string, err error) domain.APIResponse {
	return domain.APIResponse{Success: false, StatusCode: 500, Message: message, Errors: []string{err.Error()}}
}
