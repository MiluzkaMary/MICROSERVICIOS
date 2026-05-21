from datetime import datetime, timezone
import os
import time

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from sqlalchemy import text

from opentelemetry import trace
from opentelemetry.exporter.zipkin.json import ZipkinExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from .auth import requiere_admin, requiere_auth
from .database import get_db
from .repository import DepartamentoRepository
from .schemas import DepartamentoInput

app = FastAPI(
    title="API de Departamentos - Microservicio",
    version="1.0.0",
    docs_url="/api-docs",
    openapi_url="/api-docs.json",
)

SERVICE_NAME = os.getenv("OTEL_SERVICE_NAME", "departamentos-service")
ZIPKIN_ENDPOINT = os.getenv("OTEL_EXPORTER_ZIPKIN_ENDPOINT", "http://zipkin:9411/api/v2/spans")

http_requests_total = Counter(
    "http_requests_total",
    "Total de peticiones HTTP",
    ["service", "method", "route", "status"],
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "Duracion de peticiones HTTP en segundos",
    ["service", "method", "route", "status"],
)


def init_tracing() -> None:
    resource = Resource.create({"service.name": SERVICE_NAME})
    trace_provider = TracerProvider(resource=resource)
    span_processor = BatchSpanProcessor(ZipkinExporter(endpoint=ZIPKIN_ENDPOINT))
    trace_provider.add_span_processor(span_processor)
    trace.set_tracer_provider(trace_provider)
    FastAPIInstrumentor.instrument_app(app)


init_tracing()


@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = time.perf_counter() - start
    route = request.url.path
    labels = {
        "service": SERVICE_NAME,
        "method": request.method,
        "route": route,
        "status": str(response.status_code),
    }
    http_requests_total.labels(**labels).inc()
    http_request_duration_seconds.labels(**labels).observe(elapsed)
    return response


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def _controller_error(status_code: int, message: str, path: str, errors: list[str] | None = None) -> dict:
    names = {
        400: "Bad Request",
        404: "Not Found",
        409: "Conflict",
        500: "Internal Server Error",
    }
    payload = {
        "error": names.get(status_code, "Error"),
        "message": message,
        "status": status_code,
        "path": path,
        "timestamp": _timestamp(),
    }
    if errors is not None:
        payload["errors"] = errors
    return payload


def _normalize_input(data: DepartamentoInput) -> tuple[str, str, list[str]]:
    nombre = (data.nombre or "").strip()
    descripcion = (data.descripcion or "").strip()
    errores: list[str] = []
    if not nombre:
        errores.append("nombre es requerido")
    return nombre, descripcion, errores


def _parse_positive_int(value: str | None, default: int, minimum: int = 1, maximum: int | None = None) -> int:
    try:
        parsed = int(value) if value is not None and str(value).strip() != "" else default
    except (TypeError, ValueError):
        parsed = default

    parsed = max(parsed, minimum)
    if maximum is not None:
        parsed = min(parsed, maximum)
    return parsed


def _model_to_json(item) -> dict:
    return {
        "id": int(item.id),
        "nombre": (item.nombre or "").strip(),
        "descripcion": (item.descripcion or "").strip(),
    }


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)

    return JSONResponse(
        status_code=exc.status_code,
        content=_controller_error(exc.status_code, str(exc.detail), request.url.path),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content=_controller_error(400, "Datos inválidos", request.url.path, ["nombre es requerido"]),
    )


@app.get("/health")
async def health(db: Session = Depends(get_db)):
    checks = {"database": "UP", "messageBroker": "N/A"}
    status = "UP"
    status_code = 200

    try:
        db.execute(text("SELECT 1"))
    except Exception:
        checks["database"] = "DOWN"
        status = "DOWN"
        status_code = 503

    return JSONResponse(
        status_code=status_code,
        content={"status": status, "service": "departamentos-service", "checks": checks},
    )


@app.get("/metrics")
async def metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.post("/departamentos", status_code=201)
async def crear_departamento(
    payload: DepartamentoInput,
    _admin: dict = Depends(requiere_admin),
    db: Session = Depends(get_db),
):
    nombre, descripcion, errores = _normalize_input(payload)
    if errores:
        return JSONResponse(
            status_code=400,
            content=_controller_error(400, "Datos inválidos", "/departamentos", errores),
        )

    try:
        existente = DepartamentoRepository.buscar_por_nombre(db, nombre)
        if existente:
            return JSONResponse(
                status_code=409,
                content=_controller_error(
                    409,
                    f"Ya existe un departamento con el nombre {nombre}",
                    "/departamentos",
                ),
            )

        creado = DepartamentoRepository.crear(db, nombre, descripcion)
        return JSONResponse(status_code=201, content=_model_to_json(creado))
    except SQLAlchemyError:
        return JSONResponse(
            status_code=500,
            content=_controller_error(500, "Error interno al crear el departamento", "/departamentos"),
        )


@app.get("/departamentos/{departamento_id}", status_code=201)
async def obtener_departamento_por_id(
    departamento_id: int,
    _usuario: dict = Depends(requiere_auth),
    db: Session = Depends(get_db),
):
    path = f"/departamentos/{departamento_id}"
    try:
        departamento = DepartamentoRepository.buscar_por_id(db, departamento_id)
        if not departamento:
            return JSONResponse(
                status_code=404,
                content=_controller_error(404, f"El departamento con id {departamento_id} no existe", path),
            )

        return JSONResponse(status_code=201, content=_model_to_json(departamento))
    except SQLAlchemyError:
        return JSONResponse(
            status_code=500,
            content=_controller_error(500, "Error interno al obtener el departamento", path),
        )


@app.get("/departamentos", status_code=201)
async def obtener_departamentos(
    request: Request,
    _usuario: dict = Depends(requiere_auth),
    db: Session = Depends(get_db),
):
    page = _parse_positive_int(request.query_params.get("page"), 1)
    size = _parse_positive_int(request.query_params.get("size"), 10, maximum=100)
    q = request.query_params.get("q", "").strip().lower() or None
    nombre = request.query_params.get("nombre", "").strip().lower() or None
    sort_by = request.query_params.get("sortBy", "id")
    order = request.query_params.get("order", "ASC")

    try:
        resultado = DepartamentoRepository.obtener_con_paginacion(
            db,
            page=page,
            size=size,
            sort_by=sort_by,
            order=order,
            q=q,
            nombre=nombre,
        )
        payload = {
            "page": resultado["page"],
            "size": resultado["size"],
            "totalRecords": resultado["totalRecords"],
            "totalPages": resultado["totalPages"],
            "items": [_model_to_json(item) for item in resultado["items"]],
        }
        return JSONResponse(status_code=201, content=payload)
    except (ValueError, TypeError):
        return JSONResponse(
            status_code=500,
            content=_controller_error(500, "Error interno al obtener los departamentos", "/departamentos"),
        )
    except SQLAlchemyError:
        return JSONResponse(
            status_code=500,
            content=_controller_error(500, "Error interno al obtener los departamentos", "/departamentos"),
        )


@app.exception_handler(404)
async def not_found_handler(request: Request, _exc):
    return JSONResponse(
        status_code=404,
        content={
            "success": False,
            "statusCode": 404,
            "error": "Not Found",
            "message": f"La ruta {request.method} {request.url.path} no existe",
            "code": "NOT_FOUND",
            "path": request.url.path,
            "method": request.method,
            "timestamp": _timestamp(),
        },
    )
