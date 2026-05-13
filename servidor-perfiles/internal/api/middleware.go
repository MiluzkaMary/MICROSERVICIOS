package api

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const usuarioContextKey contextKey = "usuario"

type UsuarioClaims struct {
	Role string `json:"role"`
	jwt.RegisteredClaims
}

func RequiereAuth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if !strings.HasPrefix(authHeader, "Bearer ") {
				writeJSON(w, http.StatusUnauthorized, map[string]any{"success": false, "statusCode": http.StatusUnauthorized, "message": "Token de autenticación no proporcionado. Incluya el header Authorization: Bearer <token>"})
				return
			}

			tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
			token, err := jwt.ParseWithClaims(tokenString, &UsuarioClaims{}, func(token *jwt.Token) (any, error) {
				return []byte(jwtSecret), nil
			})
			if err != nil || !token.Valid {
				writeJSON(w, http.StatusUnauthorized, map[string]any{"success": false, "statusCode": http.StatusUnauthorized, "message": "Token inválido o malformado."})
				return
			}

			claims, ok := token.Claims.(*UsuarioClaims)
			if !ok {
				writeJSON(w, http.StatusUnauthorized, map[string]any{"success": false, "statusCode": http.StatusUnauthorized, "message": "Error al validar el token de autenticación."})
				return
			}

			ctx := context.WithValue(r.Context(), usuarioContextKey, map[string]string{"empleadoId": claims.Subject, "role": claims.Role})
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
