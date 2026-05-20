cat > /tmp/test-ci.env <<'EOF'
JWT_SECRET=ci-jwt-secret-for-jenkins
JWT_EXPIRATION=24h
JWT_EXPIRES_IN=24h
DB_USER=postgres
DB_PASSWORD=postgres
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
AUTH_SERVICE_URL=http://auth-service:8084
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_FROM="Sistema RH <rh@empresa.com>"
ADMIN_EMAIL=admin@empresa.com
ADMIN_PASSWORD=admin123
USER_EMAIL=juan.solis@gmail.com
USER_PASSWORD=Rabbit
EOF
set -a
. /tmp/test-ci.env
set +a
echo "OK:$SMTP_FROM"
