package validation

import (
	"testing"
)

func TestValidarEmpleadoIDValid(t *testing.T) {
	errores := ValidarEmpleadoID("EMP001")
	if len(errores) != 0 {
		t.Errorf("Expected no errors for valid empleadoID, got %v", errores)
	}
}

func TestValidarEmpleadoIDEmpty(t *testing.T) {
	errores := ValidarEmpleadoID("")
	if len(errores) == 0 {
		t.Errorf("Expected error for empty empleadoID, got none")
	}
	if len(errores) > 0 && errores[0] != "El empleadoId es requerido" {
		t.Errorf("Expected 'El empleadoId es requerido', got %s", errores[0])
	}
}

func TestValidarEmpleadoIDWhitespace(t *testing.T) {
	errores := ValidarEmpleadoID("   ")
	if len(errores) == 0 {
		t.Errorf("Expected error for whitespace-only empleadoID, got none")
	}
}

func TestValidarEmpleadoIDTooLong(t *testing.T) {
	long := "a"
	for i := 0; i < 51; i++ {
		long += "a"
	}
	errores := ValidarEmpleadoID(long)
	if len(errores) == 0 {
		t.Errorf("Expected error for too long empleadoID, got none")
	}
}

func TestValidarFormatoEmailValid(t *testing.T) {
	tests := []string{
		"test@example.com",
		"user.name@example.co.uk",
		"user+tag@example.com",
	}
	for _, email := range tests {
		if !ValidarFormatoEmail(email) {
			t.Errorf("Expected %s to be valid email, got invalid", email)
		}
	}
}

func TestValidarFormatoEmailInvalid(t *testing.T) {
	tests := []string{
		"not-an-email",
		"user@",
		"@example.com",
		"user @example.com",
	}
	for _, email := range tests {
		if ValidarFormatoEmail(email) {
			t.Errorf("Expected %s to be invalid email, got valid", email)
		}
	}
}

func TestValidarCreacionDefaultValid(t *testing.T) {
	errores := ValidarCreacionDefault("EMP001", "Juan Pérez", "juan@example.com")
	if len(errores) != 0 {
		t.Errorf("Expected no errors for valid data, got %v", errores)
	}
}

func TestValidarCreacionDefaultEmpleadoIDEmpty(t *testing.T) {
	errores := ValidarCreacionDefault("", "Juan Pérez", "juan@example.com")
	if len(errores) == 0 {
		t.Errorf("Expected error for empty empleadoID, got none")
	}
}

func TestValidarCreacionDefaultNombreEmpty(t *testing.T) {
	errores := ValidarCreacionDefault("EMP001", "", "juan@example.com")
	if len(errores) == 0 {
		t.Errorf("Expected error for empty nombre, got none")
	}
}

func TestValidarCreacionDefaultNombreTooLong(t *testing.T) {
	long := "a"
	for i := 0; i < 101; i++ {
		long += "a"
	}
	errores := ValidarCreacionDefault("EMP001", long, "juan@example.com")
	if len(errores) == 0 {
		t.Errorf("Expected error for too long nombre, got none")
	}
}

func TestValidarCreacionDefaultEmailEmpty(t *testing.T) {
	errores := ValidarCreacionDefault("EMP001", "Juan Pérez", "")
	if len(errores) == 0 {
		t.Errorf("Expected error for empty email, got none")
	}
}

func TestValidarCreacionDefaultEmailInvalid(t *testing.T) {
	errores := ValidarCreacionDefault("EMP001", "Juan Pérez", "not-an-email")
	if len(errores) == 0 {
		t.Errorf("Expected error for invalid email, got none")
	}
}

func TestValidarCreacionDefaultEmailTooLong(t *testing.T) {
	long := "a"
	for i := 0; i < 150; i++ {
		long += "a"
	}
	long += "@example.com"
	errores := ValidarCreacionDefault("EMP001", "Juan Pérez", long)
	if len(errores) == 0 {
		t.Errorf("Expected error for too long email, got none")
	}
}

func TestValidarActualizacionValid(t *testing.T) {
	input := map[string]any{
		"telefono":  "+34 123 456 789",
		"direccion": "Calle Principal 123",
		"ciudad":    "Madrid",
		"biografia": "Desarrollador senior",
	}
	errores := ValidarActualizacion(input)
	if len(errores) != 0 {
		t.Errorf("Expected no errors for valid update, got %v", errores)
	}
}

func TestValidarActualizacionTelefonoTooLong(t *testing.T) {
	input := map[string]any{
		"telefono": "1234567890123456789012",
	}
	errores := ValidarActualizacion(input)
	if len(errores) == 0 {
		t.Errorf("Expected error for too long telefono, got none")
	}
}

func TestValidarActualizacionDireccionTooLong(t *testing.T) {
	long := "a"
	for i := 0; i < 256; i++ {
		long += "a"
	}
	input := map[string]any{
		"direccion": long,
	}
	errores := ValidarActualizacion(input)
	if len(errores) == 0 {
		t.Errorf("Expected error for too long direccion, got none")
	}
}

func TestValidarActualizacionCiudadTooLong(t *testing.T) {
	long := "a"
	for i := 0; i < 101; i++ {
		long += "a"
	}
	input := map[string]any{
		"ciudad": long,
	}
	errores := ValidarActualizacion(input)
	if len(errores) == 0 {
		t.Errorf("Expected error for too long ciudad, got none")
	}
}

func TestValidarActualizacionBiografiaTooLong(t *testing.T) {
	long := "a"
	for i := 0; i < 1001; i++ {
		long += "a"
	}
	input := map[string]any{
		"biografia": long,
	}
	errores := ValidarActualizacion(input)
	if len(errores) == 0 {
		t.Errorf("Expected error for too long biografia, got none")
	}
}

func TestValidarActualizacionInvalidType(t *testing.T) {
	input := map[string]any{
		"telefono": 123,
	}
	errores := ValidarActualizacion(input)
	if len(errores) == 0 {
		t.Errorf("Expected error for invalid telefono type, got none")
	}
}

func TestValidarActualizacionEmptyInput(t *testing.T) {
	input := map[string]any{}
	errores := ValidarActualizacion(input)
	if len(errores) != 0 {
		t.Errorf("Expected no errors for empty input, got %v", errores)
	}
}

func TestValidarActualizacionNilValue(t *testing.T) {
	input := map[string]any{
		"telefono": nil,
	}
	errores := ValidarActualizacion(input)
	if len(errores) != 0 {
		t.Errorf("Expected no errors for nil value, got %v", errores)
	}
}
