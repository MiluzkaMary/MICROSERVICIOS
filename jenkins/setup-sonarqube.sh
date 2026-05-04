#!/bin/bash
set -euo pipefail

SONAR_URL="http://localhost:9000"
SONAR_ADMIN_USER="admin"
SONAR_ADMIN_PASS="admin"
SONAR_NEW_PASS="admin2025"

MAX_RETRIES=30
SLEEP_SECONDS=10

api_post() {
  local auth="$1"
  local endpoint="$2"
  shift 2
  curl -sS -u "$auth" -X POST "$SONAR_URL$endpoint" "$@"
}

echo "Esperando a que SonarQube esté disponible en $SONAR_URL ..."
ready=0
for i in $(seq 1 "$MAX_RETRIES"); do
  if curl -sS "$SONAR_URL/api/system/status" >/dev/null 2>&1; then
    ready=1
    echo "SonarQube respondió en el intento $i."
    break
  fi
  echo "Intento $i/$MAX_RETRIES: SonarQube aún no responde. Reintentando en ${SLEEP_SECONDS}s..."
  sleep "$SLEEP_SECONDS"
done

if [ "$ready" -ne 1 ]; then
  echo "No fue posible conectar a SonarQube después de $MAX_RETRIES intentos."
  exit 1
fi

echo "Cambiando contraseña de admin..."
api_post "$SONAR_ADMIN_USER:$SONAR_ADMIN_PASS" \
  "/api/users/change_password" \
  -d "login=$SONAR_ADMIN_USER" \
  -d "previousPassword=$SONAR_ADMIN_PASS" \
  -d "password=$SONAR_NEW_PASS" >/dev/null || true

SONAR_AUTH="$SONAR_ADMIN_USER:$SONAR_NEW_PASS"

echo "Creando proyectos..."
api_post "$SONAR_AUTH" "/api/projects/create" \
  -d "project=servidor-empleados" \
  -d "name=Servidor Empleados" >/dev/null || true

api_post "$SONAR_AUTH" "/api/projects/create" \
  -d "project=servidor-departamentos" \
  -d "name=Servidor Departamentos" >/dev/null || true

echo "Creando Quality Gate y condición coverage >= 70..."
api_post "$SONAR_AUTH" "/api/qualitygates/create" \
  -d "name=microservicios-qg" >/dev/null || true

api_post "$SONAR_AUTH" "/api/qualitygates/create_condition" \
  -d "gateName=microservicios-qg" \
  -d "metric=coverage" \
  -d "op=LT" \
  -d "error=70" >/dev/null || true

echo "Asignando Quality Gate a proyectos..."
api_post "$SONAR_AUTH" "/api/qualitygates/select" \
  -d "projectKey=servidor-empleados" \
  -d "gateName=microservicios-qg" >/dev/null || true

api_post "$SONAR_AUTH" "/api/qualitygates/select" \
  -d "projectKey=servidor-departamentos" \
  -d "gateName=microservicios-qg" >/dev/null || true

echo "Generando token para Jenkins..."
TOKEN_RESPONSE=$(api_post "$SONAR_AUTH" "/api/user_tokens/generate" -d "name=jenkins-token")
SONAR_TOKEN=$(echo "$TOKEN_RESPONSE" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

if [ -z "$SONAR_TOKEN" ]; then
  echo "No se pudo generar o extraer el token de SonarQube."
  echo "Respuesta: $TOKEN_RESPONSE"
  exit 1
fi

echo "Creando webhook para Jenkins..."
api_post "$SONAR_AUTH" "/api/webhooks/create" \
  -d "name=jenkins-webhook" \
  -d "url=http://jenkins:8080/sonarqube-webhook/" >/dev/null || true

echo "─────────────────────────────────────"
echo "✅ SonarQube configurado correctamente"
echo "SONAR_TOKEN=$SONAR_TOKEN"
echo "→ Pega esa línea en el .env del proyecto"
echo "→ Luego ejecuta: docker compose restart jenkins"
echo "─────────────────────────────────────"
