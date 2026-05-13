package validation

import (
	"net/mail"
	"strconv"
	"strings"
)

func ValidarEmpleadoID(empleadoID string) []string {
	errores := make([]string, 0)
	empleadoID = strings.TrimSpace(empleadoID)
	if empleadoID == "" {
		errores = append(errores, "El empleadoId es requerido")
	} else if len(empleadoID) > 50 {
		errores = append(errores, "El empleadoId no puede tener más de 50 caracteres")
	}
	return errores
}

func ValidarActualizacion(input map[string]any) []string {
	errores := make([]string, 0)
	validateField := func(key string, max int, label string) {
		if value, ok := input[key]; ok && value != nil {
			text, ok := value.(string)
			if !ok {
				errores = append(errores, "El "+label+" debe ser una cadena de texto")
				return
			}
			if len(text) > max {
				errores = append(errores, "El "+label+" no puede tener más de "+strconv.Itoa(max)+" caracteres")
			}
		}
	}

	validateField("telefono", 20, "teléfono")
	validateField("direccion", 255, "dirección")
	validateField("ciudad", 100, "ciudad")
	validateField("biografia", 1000, "biografía")
	return errores
}

func ValidarCreacionDefault(empleadoID, nombre, email string) []string {
	errores := make([]string, 0)
	empleadoID = strings.TrimSpace(empleadoID)
	nombre = strings.TrimSpace(nombre)
	email = strings.TrimSpace(email)

	if empleadoID == "" {
		errores = append(errores, "El empleadoId es requerido")
	}
	if nombre == "" {
		errores = append(errores, "El nombre es requerido")
	} else if len(nombre) > 100 {
		errores = append(errores, "El nombre no puede tener más de 100 caracteres")
	}
	if email == "" {
		errores = append(errores, "El email es requerido")
	} else if !ValidarFormatoEmail(email) {
		errores = append(errores, "El email no tiene un formato válido")
	} else if len(email) > 150 {
		errores = append(errores, "El email no puede tener más de 150 caracteres")
	}
	return errores
}

func ValidarFormatoEmail(email string) bool {
	_, err := mail.ParseAddress(email)
	return err == nil
}
