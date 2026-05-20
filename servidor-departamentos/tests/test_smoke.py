def test_health_returns_200(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "OK", "service": "servidor-departamentos"}


def test_departamentos_without_token_returns_401(client):
    response = client.get("/departamentos")

    assert response.status_code == 401


def test_departamentos_with_pagination_returns_metadata(client, monkeypatch):
    from app import main

    def fake_auth():
        return {"empleadoId": "1", "role": "ADMIN"}

    def fake_pagination(*args, **kwargs):
        return {
            "page": 2,
            "size": 5,
            "totalRecords": 11,
            "totalPages": 3,
            "items": [
                type("Departamento", (), {"id": 10, "nombre": "Tecnologia", "descripcion": "TI"})(),
                type("Departamento", (), {"id": 11, "nombre": "Finanzas", "descripcion": "Finanzas"})(),
            ],
        }

    client.app.dependency_overrides[main.requiere_auth] = fake_auth
    monkeypatch.setattr(main.DepartamentoRepository, "obtener_con_paginacion", staticmethod(fake_pagination))

    response = client.get("/departamentos?page=2&size=5")

    assert response.status_code == 201
    assert response.json() == {
        "page": 2,
        "size": 5,
        "totalRecords": 11,
        "totalPages": 3,
        "items": [
            {"id": 10, "nombre": "Tecnologia", "descripcion": "TI"},
            {"id": 11, "nombre": "Finanzas", "descripcion": "Finanzas"},
        ],
    }
