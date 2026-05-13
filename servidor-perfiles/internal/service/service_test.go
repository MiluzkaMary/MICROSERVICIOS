package service

import (
	"context"
	"errors"
	"testing"

	"servidor-perfiles/internal/domain"
	"servidor-perfiles/internal/repository"
)

type fakeRepo struct {
	findByID         *domain.Perfil
	findByErr        error
	findAll          []domain.Perfil
	findAllErr       error
	findPaginated    repository.PageResult
	findPaginatedErr error
	createResult     *domain.Perfil
	updateResult     *domain.Perfil
	deactivateResult *domain.Perfil
	reactivateResult *domain.Perfil
	existsByID       bool
	existsByEmail    bool
	createErr        error
	updateErr        error
	deactivateErr    error
	reactivateErr    error
	createCalled     bool
	updateCalled     bool
	deactivateCalled bool
	reactivateCalled bool
}

func (f *fakeRepo) FindByEmpleadoID(context.Context, string) (*domain.Perfil, error) {
	return f.findByID, f.findByErr
}
func (f *fakeRepo) FindAll(context.Context) ([]domain.Perfil, error) { return f.findAll, f.findAllErr }
func (f *fakeRepo) FindPaginated(context.Context, domain.ListOptions) (repository.PageResult, error) {
	return f.findPaginated, f.findPaginatedErr
}
func (f *fakeRepo) Create(context.Context, domain.Perfil) (*domain.Perfil, error) {
	f.createCalled = true
	return f.createResult, f.createErr
}
func (f *fakeRepo) UpdateByEmpleadoID(context.Context, string, domain.Perfil) (*domain.Perfil, error) {
	f.updateCalled = true
	return f.updateResult, f.updateErr
}
func (f *fakeRepo) DeactivateByEmpleadoID(context.Context, string) (*domain.Perfil, error) {
	f.deactivateCalled = true
	return f.deactivateResult, f.deactivateErr
}
func (f *fakeRepo) ReactivateByEmpleadoID(context.Context, string) (*domain.Perfil, error) {
	f.reactivateCalled = true
	return f.reactivateResult, f.reactivateErr
}
func (f *fakeRepo) ExistsByEmpleadoID(context.Context, string) (bool, error) {
	return f.existsByID, nil
}
func (f *fakeRepo) ExistsByEmail(context.Context, string) (bool, error) { return f.existsByEmail, nil }

func TestCreateProfileFromEventSuccess(t *testing.T) {
	repo := &fakeRepo{createResult: &domain.Perfil{EmpleadoID: "E001", Nombre: "Juan", Email: "juan@empresa.com"}}
	svc := NewPerfilService(repo)

	result := svc.CreateProfileFromEvent(context.Background(), domain.EventoEmpleadoCreado{EmpleadoID: "E001", Nombre: "Juan", Email: "juan@empresa.com"})

	if !result.Success || result.StatusCode != 201 {
		t.Fatalf("expected success 201, got %+v", result)
	}
	if !repo.createCalled {
		t.Fatal("expected create to be called")
	}
}

func TestCreateProfileFromEventDuplicate(t *testing.T) {
	svc := NewPerfilService(&fakeRepo{existsByID: true})

	result := svc.CreateProfileFromEvent(context.Background(), domain.EventoEmpleadoCreado{EmpleadoID: "E001", Nombre: "Juan", Email: "juan@empresa.com"})

	if result.StatusCode != 409 || result.Success {
		t.Fatalf("expected conflict, got %+v", result)
	}
}

func TestDeactivateProfileNotFound(t *testing.T) {
	svc := NewPerfilService(&fakeRepo{})

	result := svc.DeactivateProfile(context.Background(), "E999")

	if result.StatusCode != 404 || result.Success {
		t.Fatalf("expected not found, got %+v", result)
	}
}

func TestListProfilesUsesPaginationResult(t *testing.T) {
	repo := &fakeRepo{findPaginated: repository.PageResult{Page: 2, Size: 5, TotalRecords: 12, TotalPages: 3, Items: []domain.Perfil{{EmpleadoID: "E001"}}}}
	svc := NewPerfilService(repo)

	result := svc.ListProfiles(context.Background(), domain.ListOptions{Page: 2, Size: 5})

	if result.StatusCode != 200 || !result.Success {
		t.Fatalf("expected success, got %+v", result)
	}
	data, ok := result.Data.(domain.ListPage)
	if !ok {
		t.Fatalf("expected domain.ListPage, got %T", result.Data)
	}
	if data.TotalPages != 3 || data.TotalRecords != 12 {
		t.Fatalf("unexpected pagination result: %+v", data)
	}
}

func TestUpdateProfilePropagatesRepoError(t *testing.T) {
	repo := &fakeRepo{existsByID: true, updateErr: errors.New("db error")}
	svc := NewPerfilService(repo)

	result := svc.UpdateProfile(context.Background(), "E001", domain.PerfilInput{Telefono: "300"})

	if result.StatusCode != 500 || result.Success {
		t.Fatalf("expected internal error, got %+v", result)
	}
}
