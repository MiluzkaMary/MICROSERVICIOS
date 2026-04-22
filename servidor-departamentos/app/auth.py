import os
from datetime import datetime, timezone

from fastapi import Depends, Header, HTTPException, Request
from jose import ExpiredSignatureError, JWTError, jwt

JWT_SECRET = os.getenv("JWT_SECRET", "secret-key-cambiar-en-produccion")

ERROR_CODES = {
    "TOKEN_MISSING": "TOKEN_MISSING",
    "TOKEN_INVALID": "TOKEN_INVALID",
    "TOKEN_EXPIRED": "TOKEN_EXPIRED",
    "UNAUTHORIZED": "UNAUTHORIZED",
    "INSUFFICIENT_PERMISSIONS": "INSUFFICIENT_PERMISSIONS",
}

HTTP_ERROR_NAMES = {
    401: "Unauthorized",
    403: "Forbidden",
}


def _error_response(status_code: int, message: str, code: str, request: Request) -> dict:
    return {
        "success": False,
        "statusCode": status_code,
        "error": HTTP_ERROR_NAMES.get(status_code, "Error"),
        "message": message,
        "code": code,
        "path": request.url.path,
        "method": request.method,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def requiere_auth(
    request: Request,
    authorization: str | None = Header(default=None, convert_underscores=False),
) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail=_error_response(
                401,
                "Token de autenticación no proporcionado. Incluya el header Authorization: Bearer <token>",
                ERROR_CODES["TOKEN_MISSING"],
                request,
            ),
        )

    token = authorization[7:]
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail=_error_response(
                401,
                "El token ha expirado. Inicia sesión nuevamente.",
                ERROR_CODES["TOKEN_EXPIRED"],
                request,
            ),
        ) from None
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail=_error_response(
                401,
                "Token inválido o malformado.",
                ERROR_CODES["TOKEN_INVALID"],
                request,
            ),
        ) from None
    except Exception:
        raise HTTPException(
            status_code=401,
            detail=_error_response(
                401,
                "Error al validar el token de autenticación.",
                ERROR_CODES["UNAUTHORIZED"],
                request,
            ),
        ) from None

    return {
        "empleadoId": decoded.get("sub"),
        "role": decoded.get("role"),
    }


def requiere_admin(request: Request, usuario: dict = Depends(requiere_auth)) -> dict:
    if not usuario:
        raise HTTPException(
            status_code=401,
            detail=_error_response(
                401,
                "No autenticado. Debe iniciar sesión primero.",
                ERROR_CODES["UNAUTHORIZED"],
                request,
            ),
        )

    if usuario.get("role") != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail=_error_response(
                403,
                "Acceso denegado. Este endpoint requiere permisos de administrador.",
                ERROR_CODES["INSUFFICIENT_PERMISSIONS"],
                request,
            ),
        )

    return usuario
