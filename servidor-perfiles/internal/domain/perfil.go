package domain

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"
)

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

func (e *EventoEmpleadoCreado) UnmarshalJSON(data []byte) error {
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}

	if rawEmpleadoID, ok := raw["empleadoId"]; ok {
		if len(rawEmpleadoID) == 0 || string(rawEmpleadoID) == "null" {
			e.EmpleadoID = ""
		} else if rawEmpleadoID[0] == '"' {
			if err := json.Unmarshal(rawEmpleadoID, &e.EmpleadoID); err != nil {
				return err
			}
		} else {
			var numericEmpleadoID float64
			if err := json.Unmarshal(rawEmpleadoID, &numericEmpleadoID); err != nil {
				return err
			}
			if numericEmpleadoID == float64(int64(numericEmpleadoID)) {
				e.EmpleadoID = strconv.FormatInt(int64(numericEmpleadoID), 10)
			} else {
				e.EmpleadoID = strings.TrimRight(strings.TrimRight(fmt.Sprintf("%f", numericEmpleadoID), "0"), ".")
			}
		}
	}

	if rawNombre, ok := raw["nombre"]; ok {
		if err := json.Unmarshal(rawNombre, &e.Nombre); err != nil {
			return err
		}
	}

	if rawEmail, ok := raw["email"]; ok {
		if err := json.Unmarshal(rawEmail, &e.Email); err != nil {
			return err
		}
	}

	return nil
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
