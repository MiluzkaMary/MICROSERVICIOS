package rabbitmq

import (
	"context"
	"encoding/json"
	"testing"

	"servidor-perfiles/internal/domain"
)

type fakeProcessor struct {
	createdEvent     domain.EventoEmpleadoCreado
	deactivatedID    string
	reactivatedID    string
	createResult     domain.APIResponse
	deactivateResult domain.APIResponse
	reactivateResult domain.APIResponse
	createErr        error
}

func (f *fakeProcessor) CreateProfileFromEvent(context.Context, domain.EventoEmpleadoCreado) domain.APIResponse {
	return f.createResult
}
func (f *fakeProcessor) DeactivateProfile(context.Context, string) domain.APIResponse {
	return f.deactivateResult
}
func (f *fakeProcessor) ReactivateProfile(context.Context, string) domain.APIResponse {
	return f.reactivateResult
}

func TestHandleEmpleadoCreado(t *testing.T) {
	processor := &fakeProcessor{createResult: domain.APIResponse{Success: true, StatusCode: 201}}
	consumer := &Consumer{service: processor}
	body, _ := json.Marshal(map[string]any{"empleadoId": 1001, "nombre": "Juan", "email": "juan@empresa.com"})

	if err := consumer.handleEmpleadoCreado(context.Background(), body); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestHandleEmpleadoCreadoAcceptsStringEmployeeID(t *testing.T) {
	processor := &fakeProcessor{createResult: domain.APIResponse{Success: true, StatusCode: 201}}
	consumer := &Consumer{service: processor}
	body, _ := json.Marshal(map[string]any{"empleadoId": "E001", "nombre": "Juan", "email": "juan@empresa.com"})

	if err := consumer.handleEmpleadoCreado(context.Background(), body); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestHandleEmpleadoCreadoRejectsBadPayload(t *testing.T) {
	consumer := &Consumer{service: &fakeProcessor{createResult: domain.APIResponse{Success: true, StatusCode: 201}}}
	if err := consumer.handleEmpleadoCreado(context.Background(), []byte(`{"empleadoId":`)); err == nil {
		t.Fatal("expected error for invalid JSON")
	}
}

func TestHandleEmpleadoEliminadoFailsWhenServiceFails(t *testing.T) {
	consumer := &Consumer{service: &fakeProcessor{deactivateResult: domain.APIResponse{Success: false, StatusCode: 404, Message: "not found"}}}
	body, _ := json.Marshal(domain.EventoEmpleadoCreado{EmpleadoID: "E404"})
	if err := consumer.handleEmpleadoEliminado(context.Background(), body); err == nil {
		t.Fatal("expected error when service returns failure")
	}
}

func TestHandleEmpleadoReactivadoPropagatesSuccess(t *testing.T) {
	consumer := &Consumer{service: &fakeProcessor{reactivateResult: domain.APIResponse{Success: true, StatusCode: 200}}}
	body, _ := json.Marshal(domain.EventoEmpleadoCreado{EmpleadoID: "E001"})
	if err := consumer.handleEmpleadoReactivado(context.Background(), body); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}
