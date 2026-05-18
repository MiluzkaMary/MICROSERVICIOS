#!/usr/bin/env bash
# Crea un webhook en SonarQube que notifique a Jenkins sobre el Quality Gate
# Uso: SONAR_HOST=http://localhost:9000 SONAR_TOKEN=... JENKINS_URL=http://localhost:9090 ./scripts/create-sonar-webhook.sh

set -euo pipefail

SONAR_HOST=${SONAR_HOST:-http://localhost:9000}
SONAR_TOKEN=${SONAR_TOKEN:-}
JENKINS_URL=${JENKINS_URL:-http://localhost:9090}

if [ -z "$SONAR_TOKEN" ]; then
  echo "ERROR: debes exportar SONAR_TOKEN"
  exit 1
fi

WEBHOOK_NAME="Jenkins QualityGate"
WEBHOOK_URL="$JENKINS_URL/sonarqube-webhook/"

echo "Comprobando SonarQube en $SONAR_HOST ..."
for i in $(seq 1 20); do
  if curl -sSf "$SONAR_HOST/api/system/health" >/dev/null 2>&1; then
    echo "SonarQube listo"
    break
  fi
  echo "Esperando SonarQube... intento $i/20"
  sleep 3
done

echo "Creando webhook '$WEBHOOK_NAME' -> $WEBHOOK_URL"
curl -sS -X POST -u"$SONAR_TOKEN": "${SONAR_HOST}/api/webhooks/create" \
  -d "name=${WEBHOOK_NAME}" \
  -d "url=${WEBHOOK_URL}" \
  | jq . || true

echo "Hecho. Revisa en SonarQube > Administration > Configuration > Webhooks"
