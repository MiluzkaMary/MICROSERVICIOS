package api

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/golang-jwt/jwt/v5"

	"servidor-perfiles/internal/domain"
)

type fakeHTTPService struct {
	listResult   domain.APIResponse
	getResult    domain.APIResponse
	updateResult domain.APIResponse
	eventResult  domain.APIResponse
	lastEvent    domain.EventoEmpleadoCreado
	calledList   bool
	calledGet    bool
	calledUpdate bool
	calledEvent  bool
}

func (f *fakeHTTPService) ListProfiles(context.Context, domain.ListOptions) domain.APIResponse {
	f.calledList = true
	return f.listResult
}
func (f *fakeHTTPService) GetProfile(context.Context, string) domain.APIResponse {
	f.calledGet = true
	return f.getResult
}
func (f *fakeHTTPService) UpdateProfile(context.Context, string, domain.PerfilInput) domain.APIResponse {
	f.calledUpdate = true
	return f.updateResult
}
func (f *fakeHTTPService) CreateProfileFromEvent(ctx context.Context, event domain.EventoEmpleadoCreado) domain.APIResponse {
	f.calledEvent = true
	f.lastEvent = event
	return f.eventResult
}
func (f *fakeHTTPService) DeactivateProfile(context.Context, string) domain.APIResponse {
	return domain.APIResponse{Success: true, StatusCode: 200}
}
func (f *fakeHTTPService) ReactivateProfile(context.Context, string) domain.APIResponse {
	return domain.APIResponse{Success: true, StatusCode: 200}
}

func TestProtectedRouteRequiresJWT(t *testing.T) {
	router := NewRouter(&fakeHTTPService{listResult: domain.APIResponse{Success: true, StatusCode: 200, Data: []domain.Perfil{}}}, "secret")
	req := httptest.NewRequest(http.MethodGet, "/perfiles", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestGetProfileWithJWT(t *testing.T) {
	service := &fakeHTTPService{getResult: domain.APIResponse{Success: true, StatusCode: 200, Data: &domain.Perfil{EmpleadoID: "E001"}}}
	router := NewRouter(service, "secret")
	req := httptest.NewRequest(http.MethodGet, "/perfiles/E001", nil)
	req.Header.Set("Authorization", "Bearer "+signedToken("secret", "E001", "ADMIN"))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK || !service.calledGet {
		t.Fatalf("expected 200 and service call, got %d", rec.Code)
	}
}

func TestEventEndpointDoesNotRequireJWT(t *testing.T) {
	service := &fakeHTTPService{eventResult: domain.APIResponse{Success: true, StatusCode: 201, Message: "ok"}}
	router := NewRouter(service, "secret")
	body, _ := json.Marshal(domain.EventoEmpleadoCreado{EmpleadoID: "E001", Nombre: "Juan", Email: "juan@empresa.com"})
	req := httptest.NewRequest(http.MethodPost, "/perfiles/evento/empleado-creado", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated || !service.calledEvent {
		t.Fatalf("expected 201 and event call, got %d", rec.Code)
	}
	if service.lastEvent.EmpleadoID != "E001" {
		t.Fatalf("unexpected event payload: %+v", service.lastEvent)
	}
}

func TestUpdateProfileValidation(t *testing.T) {
	service := &fakeHTTPService{updateResult: domain.APIResponse{Success: true, StatusCode: 200}}
	router := NewRouter(service, "secret")
	body := bytes.NewBufferString(`{"biografia":"` + strings.Repeat("x", 1001) + `"}`)
	req := httptest.NewRequest(http.MethodPut, "/perfiles/E001", body)
	req.Header.Set("Authorization", "Bearer "+signedToken("secret", "E001", "ADMIN"))
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func signedToken(secret, subject, role string) string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, UsuarioClaims{
		Role:             role,
		RegisteredClaims: jwt.RegisteredClaims{Subject: subject},
	})
	value, _ := token.SignedString([]byte(secret))
	return value
}
