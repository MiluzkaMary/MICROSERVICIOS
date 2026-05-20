package domain

import (
	"encoding/json"
	"reflect"
	"testing"
	"time"
)

func TestPerfilStructure(t *testing.T) {
	now := time.Now()
	perfil := Perfil{
		ID:                 1,
		EmpleadoID:         "EMP001",
		Nombre:             "Juan Pérez",
		Email:              "juan@example.com",
		Telefono:           "+34 123 456 789",
		Direccion:          "Calle Principal 123",
		Ciudad:             "Madrid",
		Biografia:          "Desarrollador senior",
		Activo:             true,
		FechaCreacion:      now,
		FechaActualizacion: now,
	}

	if perfil.ID != 1 {
		t.Errorf("Expected ID 1, got %d", perfil.ID)
	}
	if perfil.EmpleadoID != "EMP001" {
		t.Errorf("Expected EmpleadoID EMP001, got %s", perfil.EmpleadoID)
	}
	if perfil.Nombre != "Juan Pérez" {
		t.Errorf("Expected Nombre Juan Pérez, got %s", perfil.Nombre)
	}
	if perfil.Email != "juan@example.com" {
		t.Errorf("Expected Email juan@example.com, got %s", perfil.Email)
	}
	if !perfil.Activo {
		t.Errorf("Expected Activo true, got false")
	}
	if perfil.Telefono != "+34 123 456 789" {
		t.Errorf("Expected Telefono +34 123 456 789, got %s", perfil.Telefono)
	}
	if perfil.Direccion != "Calle Principal 123" {
		t.Errorf("Expected Direccion Calle Principal 123, got %s", perfil.Direccion)
	}
	if perfil.Ciudad != "Madrid" {
		t.Errorf("Expected Ciudad Madrid, got %s", perfil.Ciudad)
	}
	if perfil.Biografia != "Desarrollador senior" {
		t.Errorf("Expected Biografia Desarrollador senior, got %s", perfil.Biografia)
	}
	if perfil.FechaCreacion.IsZero() {
		t.Errorf("Expected FechaCreacion to be set")
	}
	if perfil.FechaActualizacion.IsZero() {
		t.Errorf("Expected FechaActualizacion to be set")
	}
}

func TestPerfilInputStructure(t *testing.T) {
	input := PerfilInput{
		Telefono:  "+34 123 456 789",
		Direccion: "Calle Principal 123",
		Ciudad:    "Madrid",
		Biografia: "Desarrollador senior",
	}

	if input.Telefono != "+34 123 456 789" {
		t.Errorf("Expected Telefono +34 123 456 789, got %s", input.Telefono)
	}
	if input.Ciudad != "Madrid" {
		t.Errorf("Expected Ciudad Madrid, got %s", input.Ciudad)
	}
	if input.Direccion != "Calle Principal 123" {
		t.Errorf("Expected Direccion Calle Principal 123, got %s", input.Direccion)
	}
	if input.Biografia != "Desarrollador senior" {
		t.Errorf("Expected Biografia Desarrollador senior, got %s", input.Biografia)
	}
}

func TestEventoEmpleadoCreadoStructure(t *testing.T) {
	evento := EventoEmpleadoCreado{
		EmpleadoID: "EMP001",
		Nombre:     "Juan Pérez",
		Email:      "juan@example.com",
	}

	if evento.EmpleadoID != "EMP001" {
		t.Errorf("Expected EmpleadoID EMP001, got %s", evento.EmpleadoID)
	}
	if evento.Nombre != "Juan Pérez" {
		t.Errorf("Expected Nombre Juan Pérez, got %s", evento.Nombre)
	}
	if evento.Email != "juan@example.com" {
		t.Errorf("Expected Email juan@example.com, got %s", evento.Email)
	}
}

func TestEventoEmpleadoCreadoUnmarshalJSON(t *testing.T) {
	tests := []struct {
		name    string
		payload string
		want    EventoEmpleadoCreado
	}{
		{
			name:    "numeric employee id",
			payload: `{"empleadoId":1001,"nombre":"Juan Pérez","email":"juan@example.com"}`,
			want:    EventoEmpleadoCreado{EmpleadoID: "1001", Nombre: "Juan Pérez", Email: "juan@example.com"},
		},
		{
			name:    "string employee id",
			payload: `{"empleadoId":"E001","nombre":"Juan Pérez","email":"juan@example.com"}`,
			want:    EventoEmpleadoCreado{EmpleadoID: "E001", Nombre: "Juan Pérez", Email: "juan@example.com"},
		},
		{
			name:    "decimal employee id",
			payload: `{"empleadoId":1001.5,"nombre":"Juan Pérez","email":"juan@example.com"}`,
			want:    EventoEmpleadoCreado{EmpleadoID: "1001.5", Nombre: "Juan Pérez", Email: "juan@example.com"},
		},
		{
			name:    "null employee id",
			payload: `{"empleadoId":null,"nombre":"Juan Pérez","email":"juan@example.com"}`,
			want:    EventoEmpleadoCreado{EmpleadoID: "", Nombre: "Juan Pérez", Email: "juan@example.com"},
		},
		{
			name:    "missing employee id",
			payload: `{"nombre":"Juan Pérez","email":"juan@example.com"}`,
			want:    EventoEmpleadoCreado{EmpleadoID: "", Nombre: "Juan Pérez", Email: "juan@example.com"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var evento EventoEmpleadoCreado
			if err := json.Unmarshal([]byte(tt.payload), &evento); err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if !reflect.DeepEqual(evento, tt.want) {
				t.Fatalf("unexpected event: got %+v want %+v", evento, tt.want)
			}
		})
	}
}

func TestEventoEmpleadoCreadoUnmarshalJSONRejectsInvalidJSON(t *testing.T) {
	var evento EventoEmpleadoCreado
	if err := json.Unmarshal([]byte(`{"empleadoId":`), &evento); err == nil {
		t.Fatal("expected error for invalid JSON")
	}
}

func TestEventoEmpleadoCreadoUnmarshalJSONRejectsInvalidNumericEmployeeID(t *testing.T) {
	var evento EventoEmpleadoCreado
	if err := json.Unmarshal([]byte(`{"empleadoId":{},"nombre":"Juan Pérez","email":"juan@example.com"}`), &evento); err == nil {
		t.Fatal("expected error for invalid numeric employee id payload")
	}
}

func TestEventoEmpleadoCreadoUnmarshalJSONRejectsInvalidNombrePayload(t *testing.T) {
	var evento EventoEmpleadoCreado
	if err := json.Unmarshal([]byte(`{"empleadoId":1001,"nombre":{},"email":"juan@example.com"}`), &evento); err == nil {
		t.Fatal("expected error for invalid nombre payload")
	}
}

func TestEventoEmpleadoCreadoUnmarshalJSONRejectsInvalidEmailPayload(t *testing.T) {
	var evento EventoEmpleadoCreado
	if err := json.Unmarshal([]byte(`{"empleadoId":1001,"nombre":"Juan Pérez","email":{}}`), &evento); err == nil {
		t.Fatal("expected error for invalid email payload")
	}
}

func TestListOptionsStructure(t *testing.T) {
	options := ListOptions{
		Page:   1,
		Size:   20,
		SortBy: "nombre",
		Order:  "asc",
		Q:      "test",
		Nombre: "Juan",
		Email:  "juan@example.com",
		Ciudad: "Madrid",
	}

	if options.Page != 1 {
		t.Errorf("Expected Page 1, got %d", options.Page)
	}
	if options.Size != 20 {
		t.Errorf("Expected Size 20, got %d", options.Size)
	}
	if options.SortBy != "nombre" {
		t.Errorf("Expected SortBy nombre, got %s", options.SortBy)
	}
	if options.Order != "asc" {
		t.Errorf("Expected Order asc, got %s", options.Order)
	}
	if options.Q != "test" {
		t.Errorf("Expected Q test, got %s", options.Q)
	}
	if options.Nombre != "Juan" {
		t.Errorf("Expected Nombre Juan, got %s", options.Nombre)
	}
	if options.Email != "juan@example.com" {
		t.Errorf("Expected Email juan@example.com, got %s", options.Email)
	}
	if options.Ciudad != "Madrid" {
		t.Errorf("Expected Ciudad Madrid, got %s", options.Ciudad)
	}
}

func TestListPageStructure(t *testing.T) {
	perfiles := []Perfil{
		{
			ID:         1,
			EmpleadoID: "EMP001",
			Nombre:     "Juan",
			Email:      "juan@example.com",
		},
	}

	page := ListPage{
		Page:         1,
		Size:         20,
		TotalRecords: 100,
		TotalPages:   5,
		Items:        perfiles,
	}

	if page.Page != 1 {
		t.Errorf("Expected Page 1, got %d", page.Page)
	}
	if page.TotalRecords != 100 {
		t.Errorf("Expected TotalRecords 100, got %d", page.TotalRecords)
	}
	if page.Size != 20 {
		t.Errorf("Expected Size 20, got %d", page.Size)
	}
	if page.TotalPages != 5 {
		t.Errorf("Expected TotalPages 5, got %d", page.TotalPages)
	}
	if len(page.Items) != 1 {
		t.Errorf("Expected 1 item, got %d", len(page.Items))
	}
}

func TestAPIResponseSuccess(t *testing.T) {
	response := APIResponse{
		Success:    true,
		StatusCode: 200,
		Message:    "OK",
		Data:       "test data",
	}

	if !response.Success {
		t.Errorf("Expected Success true, got false")
	}
	if response.StatusCode != 200 {
		t.Errorf("Expected StatusCode 200, got %d", response.StatusCode)
	}
	if response.Message != "OK" {
		t.Errorf("Expected Message OK, got %s", response.Message)
	}
	if response.Data != "test data" {
		t.Errorf("Expected Data test data, got %v", response.Data)
	}
}

func TestAPIResponseError(t *testing.T) {
	errors := []string{"Error 1", "Error 2"}
	response := APIResponse{
		Success:    false,
		StatusCode: 400,
		Message:    "Bad Request",
		Errors:     errors,
	}

	if response.Success {
		t.Errorf("Expected Success false, got true")
	}
	if len(response.Errors) != 2 {
		t.Errorf("Expected 2 errors, got %d", len(response.Errors))
	}
	if response.StatusCode != 400 {
		t.Errorf("Expected StatusCode 400, got %d", response.StatusCode)
	}
	if response.Message != "Bad Request" {
		t.Errorf("Expected Message Bad Request, got %s", response.Message)
	}
}
