from pydantic import BaseModel


class DepartamentoInput(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None


class DepartamentoOut(BaseModel):
    id: int
    nombre: str
    descripcion: str


class DepartamentoPaginado(BaseModel):
    page: int
    size: int
    totalRecords: int
    totalPages: int
    items: list[DepartamentoOut]
