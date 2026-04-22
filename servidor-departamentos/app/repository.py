from math import ceil

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from .models import Departamento


class DepartamentoRepository:
    @staticmethod
    def crear(db: Session, nombre: str, descripcion: str) -> Departamento:
        nuevo = Departamento(nombre=nombre, descripcion=descripcion)
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo

    @staticmethod
    def buscar_por_id(db: Session, departamento_id: int) -> Departamento | None:
        return db.query(Departamento).filter(Departamento.id == departamento_id).first()

    @staticmethod
    def buscar_por_nombre(db: Session, nombre: str) -> Departamento | None:
        return (
            db.query(Departamento)
            .filter(func.lower(Departamento.nombre) == nombre.lower())
            .first()
        )

    @staticmethod
    def obtener_con_paginacion(
        db: Session,
        page: int = 1,
        size: int = 10,
        sort_by: str = "id",
        order: str = "ASC",
        q: str | None = None,
        nombre: str | None = None,
    ) -> dict:
        campos_permitidos = {
            "id": Departamento.id,
            "nombre": Departamento.nombre,
            "descripcion": Departamento.descripcion,
        }
        campo_orden = campos_permitidos.get(sort_by, Departamento.id)
        orden = campo_orden.desc() if str(order).upper() == "DESC" else campo_orden.asc()

        query = db.query(Departamento)

        if q:
            pattern = f"%{q.lower()}%"
            query = query.filter(
                or_(
                    func.lower(Departamento.nombre).like(pattern),
                    func.lower(Departamento.descripcion).like(pattern),
                )
            )
        elif nombre:
            query = query.filter(func.lower(Departamento.nombre).like(f"%{nombre.lower()}%"))

        total_records = query.count()
        total_pages = ceil(total_records / size) if size > 0 else 0
        items = (
            query.order_by(orden)
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )

        return {
            "page": page,
            "size": size,
            "totalRecords": total_records,
            "totalPages": total_pages,
            "items": items,
        }
