package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"servidor-perfiles/internal/domain"
)

type PostgreSQLRepository struct {
	db *sql.DB
}

func NewPostgreSQLRepository(db *sql.DB) *PostgreSQLRepository {
	return &PostgreSQLRepository{db: db}
}

func (r *PostgreSQLRepository) FindByEmpleadoID(ctx context.Context, empleadoID string) (*domain.Perfil, error) {
	row := r.db.QueryRowContext(ctx, perfilSelectBase()+" WHERE empleado_id = $1", empleadoID)
	perfil, err := scanPerfil(row.Scan)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return perfil, nil
}

func (r *PostgreSQLRepository) FindAll(ctx context.Context) ([]domain.Perfil, error) {
	rows, err := r.db.QueryContext(ctx, perfilSelectBase()+" ORDER BY fecha_creacion DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	perfiles := make([]domain.Perfil, 0)
	for rows.Next() {
		perfil, err := scanPerfil(rows.Scan)
		if err != nil {
			return nil, err
		}
		perfiles = append(perfiles, *perfil)
	}
	return perfiles, rows.Err()
}

type PageResult struct {
	Items        []domain.Perfil
	Page         int
	Size         int
	TotalRecords int
	TotalPages   int
}

func (r *PostgreSQLRepository) FindPaginated(ctx context.Context, options domain.ListOptions) (PageResult, error) {
	whereClause, values := buildWhereClause(options)
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM perfiles %s", whereClause)

	var totalRecords int
	if err := r.db.QueryRowContext(ctx, countQuery, values...).Scan(&totalRecords); err != nil {
		return PageResult{}, err
	}

	offset := (options.Page - 1) * options.Size
	orderBy := sanitizeOrderBy(options.SortBy)
	direction := strings.ToUpper(options.Order)
	if direction != "DESC" {
		direction = "ASC"
	}

	query := fmt.Sprintf("%s %s ORDER BY %s %s LIMIT $%d OFFSET $%d", perfilSelectBase(), whereClause, orderBy, direction, len(values)+1, len(values)+2)
	rows, err := r.db.QueryContext(ctx, query, append(values, options.Size, offset)...)
	if err != nil {
		return PageResult{}, err
	}
	defer rows.Close()

	items := make([]domain.Perfil, 0)
	for rows.Next() {
		perfil, err := scanPerfil(rows.Scan)
		if err != nil {
			return PageResult{}, err
		}
		items = append(items, *perfil)
	}

	totalPages := 1
	if options.Size > 0 {
		totalPages = (totalRecords + options.Size - 1) / options.Size
		if totalPages == 0 {
			totalPages = 1
		}
	}

	return PageResult{Items: items, Page: options.Page, Size: options.Size, TotalRecords: totalRecords, TotalPages: totalPages}, rows.Err()
}

func (r *PostgreSQLRepository) Create(ctx context.Context, perfil domain.Perfil) (*domain.Perfil, error) {
	query := `
INSERT INTO perfiles (empleado_id, nombre, email, telefono, direccion, ciudad, biografia, activo)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, empleado_id, nombre, email, telefono, direccion, ciudad, biografia, activo, fecha_creacion, fecha_actualizacion`
	row := r.db.QueryRowContext(ctx, query, perfil.EmpleadoID, perfil.Nombre, perfil.Email, perfil.Telefono, perfil.Direccion, perfil.Ciudad, perfil.Biografia, perfil.Activo)
	created, err := scanPerfil(row.Scan)
	if err != nil {
		return nil, err
	}
	return created, nil
}

func (r *PostgreSQLRepository) UpdateByEmpleadoID(ctx context.Context, empleadoID string, perfil domain.Perfil) (*domain.Perfil, error) {
	query := `
UPDATE perfiles
SET telefono = $1, direccion = $2, ciudad = $3, biografia = $4
WHERE empleado_id = $5
RETURNING id, empleado_id, nombre, email, telefono, direccion, ciudad, biografia, activo, fecha_creacion, fecha_actualizacion`
	row := r.db.QueryRowContext(ctx, query, perfil.Telefono, perfil.Direccion, perfil.Ciudad, perfil.Biografia, empleadoID)
	updated, err := scanPerfil(row.Scan)
	if err != nil {
		return nil, err
	}
	return updated, nil
}

func (r *PostgreSQLRepository) DeactivateByEmpleadoID(ctx context.Context, empleadoID string) (*domain.Perfil, error) {
	query := `
UPDATE perfiles
SET activo = false, fecha_actualizacion = CURRENT_TIMESTAMP
WHERE empleado_id = $1
RETURNING id, empleado_id, nombre, email, telefono, direccion, ciudad, biografia, activo, fecha_creacion, fecha_actualizacion`
	row := r.db.QueryRowContext(ctx, query, empleadoID)
	perfil, err := scanPerfil(row.Scan)
	if err != nil {
		return nil, err
	}
	return perfil, nil
}

func (r *PostgreSQLRepository) ReactivateByEmpleadoID(ctx context.Context, empleadoID string) (*domain.Perfil, error) {
	query := `
UPDATE perfiles
SET activo = true, fecha_actualizacion = CURRENT_TIMESTAMP
WHERE empleado_id = $1
RETURNING id, empleado_id, nombre, email, telefono, direccion, ciudad, biografia, activo, fecha_creacion, fecha_actualizacion`
	row := r.db.QueryRowContext(ctx, query, empleadoID)
	perfil, err := scanPerfil(row.Scan)
	if err != nil {
		return nil, err
	}
	return perfil, nil
}

func (r *PostgreSQLRepository) ExistsByEmpleadoID(ctx context.Context, empleadoID string) (bool, error) {
	var exists bool
	err := r.db.QueryRowContext(ctx, "SELECT EXISTS(SELECT 1 FROM perfiles WHERE empleado_id = $1)", empleadoID).Scan(&exists)
	return exists, err
}

func (r *PostgreSQLRepository) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	var exists bool
	err := r.db.QueryRowContext(ctx, "SELECT EXISTS(SELECT 1 FROM perfiles WHERE email = $1)", email).Scan(&exists)
	return exists, err
}

func perfilSelectBase() string {
	return "SELECT id, empleado_id, nombre, email, telefono, direccion, ciudad, biografia, activo, fecha_creacion, fecha_actualizacion FROM perfiles"
}

func sanitizeOrderBy(value string) string {
	allowed := map[string]bool{"empleado_id": true, "nombre": true, "email": true, "ciudad": true, "fecha_creacion": true}
	if allowed[value] {
		return value
	}
	return "fecha_creacion"
}

func buildWhereClause(options domain.ListOptions) (string, []any) {
	conditions := make([]string, 0)
	values := make([]any, 0)
	index := 1

	addLike := func(field, value string) {
		conditions = append(conditions, fmt.Sprintf("%s ILIKE $%d", field, index))
		values = append(values, "%"+value+"%")
		index++
	}

	if options.Q != "" {
		conditions = append(conditions, fmt.Sprintf("(nombre ILIKE $%d OR email ILIKE $%d OR ciudad ILIKE $%d)", index, index, index))
		values = append(values, "%"+options.Q+"%")
		index++
	}
	if options.Nombre != "" {
		addLike("nombre", options.Nombre)
	}
	if options.Email != "" {
		addLike("email", options.Email)
	}
	if options.Ciudad != "" {
		addLike("ciudad", options.Ciudad)
	}

	if len(conditions) == 0 {
		return "", values
	}
	return "WHERE " + strings.Join(conditions, " AND "), values
}

func scanPerfil(scan func(dest ...any) error) (*domain.Perfil, error) {
	perfil := &domain.Perfil{}
	var fechaCreacion sql.NullTime
	var fechaActualizacion sql.NullTime
	if err := scan(
		&perfil.ID,
		&perfil.EmpleadoID,
		&perfil.Nombre,
		&perfil.Email,
		&perfil.Telefono,
		&perfil.Direccion,
		&perfil.Ciudad,
		&perfil.Biografia,
		&perfil.Activo,
		&fechaCreacion,
		&fechaActualizacion,
	); err != nil {
		return nil, err
	}
	if fechaCreacion.Valid {
		perfil.FechaCreacion = fechaCreacion.Time
	}
	if fechaActualizacion.Valid {
		perfil.FechaActualizacion = fechaActualizacion.Time
	}
	return perfil, nil
}
