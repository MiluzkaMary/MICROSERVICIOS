package domain

import "time"

type Perfil struct {
	ID                 int64     `json:"id"`
	EmpleadoID         string    `json:"empleadoId"`
	Nombre             string    `json:"nombre"`
	Email              string    `json:"email"`
	Telefono           string    `json:"telefono"`
	Direccion          string    `json:"direccion"`
	Ciudad             string    `json:"ciudad"`
	Biografia          string    `json:"biografia"`
	Activo             bool      `json:"activo"`
	FechaCreacion      time.Time `json:"fechaCreacion"`
	FechaActualizacion time.Time `json:"fechaActualizacion"`
}

type PerfilInput struct {
	Telefono  string `json:"telefono"`
	Direccion string `json:"direccion"`
	Ciudad    string `json:"ciudad"`
	Biografia string `json:"biografia"`
}

type EventoEmpleadoCreado struct {
	EmpleadoID string `json:"empleadoId"`
	Nombre     string `json:"nombre"`
	Email      string `json:"email"`
}

type ListOptions struct {
	Page   int
	Size   int
	SortBy string
	Order  string
	Q      string
	Nombre string
	Email  string
	Ciudad string
}

type ListPage struct {
	Page         int      `json:"page"`
	Size         int      `json:"size"`
	TotalRecords int      `json:"totalRecords"`
	TotalPages   int      `json:"totalPages"`
	Items        []Perfil `json:"items"`
}

type APIResponse struct {
	Success    bool     `json:"success"`
	StatusCode int      `json:"statusCode"`
	Message    string   `json:"message,omitempty"`
	Data       any      `json:"data,omitempty"`
	Total      int      `json:"total,omitempty"`
	Errors     []string `json:"errors,omitempty"`
}
