#!/bin/bash
set -e

# Obtener crumb con sesión persistente
CRUMB=$(curl -s -c /tmp/jenkins-cookies.txt \
  "http://admin:admin123@localhost:8080/crumbIssuer/api/json" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['crumb'])")

echo "==> Crumb obtenido: $CRUMB"

# Crear el job usando cookie + crumb
HTTP_STATUS=$(curl -s -o /tmp/create-output.txt -w "%{http_code}" \
  -b /tmp/jenkins-cookies.txt \
  -H "Jenkins-Crumb: $CRUMB" \
  -H "Content-Type: application/xml" \
  -u admin:admin123 \
  --data-binary @/tmp/pipeline-test.xml \
  "http://localhost:8080/createItem?name=verificacion-docker")

echo "==> HTTP Status creacion job: $HTTP_STATUS"
cat /tmp/create-output.txt 2>/dev/null || true

# Disparar la build
echo "==> Disparando build..."
BUILD_STATUS=$(curl -s -o /tmp/build-output.txt -w "%{http_code}" \
  -b /tmp/jenkins-cookies.txt \
  -H "Jenkins-Crumb: $CRUMB" \
  -u admin:admin123 -X POST \
  "http://localhost:8080/job/verificacion-docker/build")

echo "==> HTTP Status trigger build: $BUILD_STATUS"
echo "==> Esperando 20 segundos para que la build inicie..."
sleep 20

# Obtener resultado de la build #1
echo "==> Obteniendo resultado..."
curl -s -u admin:admin123 \
  "http://localhost:8080/job/verificacion-docker/1/consoleText"
