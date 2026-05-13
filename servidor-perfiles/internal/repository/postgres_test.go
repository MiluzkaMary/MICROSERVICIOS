package repository

import (
	"context"
	"regexp"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"

	"servidor-perfiles/internal/domain"
)

func TestFindByEmpleadoID(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock: %v", err)
	}
	defer db.Close()

	repo := NewPostgreSQLRepository(db)
	now := time.Now()
	rows := sqlmock.NewRows([]string{"id", "empleado_id", "nombre", "email", "telefono", "direccion", "ciudad", "biografia", "activo", "fecha_creacion", "fecha_actualizacion"}).AddRow(1, "E001", "Juan", "juan@empresa.com", "300", "Calle 1", "Bogotá", "Bio", true, now, now)
	mock.ExpectQuery(regexp.QuoteMeta("SELECT id, empleado_id, nombre, email, telefono, direccion, ciudad, biografia, activo, fecha_creacion, fecha_actualizacion FROM perfiles WHERE empleado_id = $1")).WithArgs("E001").WillReturnRows(rows)

	perfil, err := repo.FindByEmpleadoID(context.Background(), "E001")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if perfil == nil || perfil.EmpleadoID != "E001" {
		t.Fatalf("unexpected perfil: %+v", perfil)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("expectations not met: %v", err)
	}
}

func TestFindPaginatedBuildsExpectedQuery(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock: %v", err)
	}
	defer db.Close()

	repo := NewPostgreSQLRepository(db)
	now := time.Now()
	countRows := sqlmock.NewRows([]string{"count"}).AddRow(1)
	dataRows := sqlmock.NewRows([]string{"id", "empleado_id", "nombre", "email", "telefono", "direccion", "ciudad", "biografia", "activo", "fecha_creacion", "fecha_actualizacion"}).AddRow(1, "E001", "Juan", "juan@empresa.com", "300", "Calle 1", "Bogotá", "Bio", true, now, now)
	countQuery := regexp.QuoteMeta("SELECT COUNT(*) FROM perfiles WHERE (nombre ILIKE $1 OR email ILIKE $1 OR ciudad ILIKE $1)")
	dataQuery := regexp.QuoteMeta("SELECT id, empleado_id, nombre, email, telefono, direccion, ciudad, biografia, activo, fecha_creacion, fecha_actualizacion FROM perfiles WHERE (nombre ILIKE $1 OR email ILIKE $1 OR ciudad ILIKE $1) ORDER BY nombre ASC LIMIT $2 OFFSET $3")
	mock.ExpectQuery(countQuery).WithArgs("%ana%").WillReturnRows(countRows)
	mock.ExpectQuery(dataQuery).WithArgs("%ana%", 10, 10).WillReturnRows(dataRows)

	result, err := repo.FindPaginated(context.Background(), domain.ListOptions{Page: 2, Size: 10, SortBy: "nombre", Order: "ASC", Q: "ana"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.TotalRecords != 1 || result.TotalPages != 1 || len(result.Items) != 1 {
		t.Fatalf("unexpected result: %+v", result)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("expectations not met: %v", err)
	}
}

func TestDeactivateByEmpleadoID(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock: %v", err)
	}
	defer db.Close()

	repo := NewPostgreSQLRepository(db)
	now := time.Now()
	rows := sqlmock.NewRows([]string{"id", "empleado_id", "nombre", "email", "telefono", "direccion", "ciudad", "biografia", "activo", "fecha_creacion", "fecha_actualizacion"}).AddRow(1, "E001", "Juan", "juan@empresa.com", "300", "Calle 1", "Bogotá", "Bio", false, now, now)
	mock.ExpectQuery(regexp.QuoteMeta("UPDATE perfiles\nSET activo = false, fecha_actualizacion = CURRENT_TIMESTAMP\nWHERE empleado_id = $1\nRETURNING id, empleado_id, nombre, email, telefono, direccion, ciudad, biografia, activo, fecha_creacion, fecha_actualizacion")).WithArgs("E001").WillReturnRows(rows)

	perfil, err := repo.DeactivateByEmpleadoID(context.Background(), "E001")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if perfil == nil || perfil.Activo {
		t.Fatalf("expected inactive perfil, got %+v", perfil)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("expectations not met: %v", err)
	}
}
