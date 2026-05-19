# ============================================
# ETAPA 1: Build con Maven
# ============================================
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Copiar POM y descargar dependencias primero (caching de capas)
COPY pom.xml .
RUN i=0; \
    until [ $i -ge 5 ]; do \
      mvn dependency:go-offline -q && break; \
      i=$((i+1)); \
      echo "[retry] mvn dependency:go-offline intento ${i}/5"; \
      sleep 5; \
    done; \
    [ $i -lt 5 ] || true

# Copiar el código fuente y compilar
COPY src/ ./src/
RUN i=0; \
    until [ $i -ge 5 ]; do \
      mvn package -DskipTests -q && break; \
      i=$((i+1)); \
      echo "[retry] mvn package -DskipTests intento ${i}/5"; \
      sleep 5; \
    done; \
    [ $i -lt 5 ]

# ============================================
# ETAPA 2: Runtime
# ============================================
FROM eclipse-temurin:17-jre-alpine AS production

# Crear usuario sin privilegios
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copiar el JAR generado
COPY --from=builder --chown=appuser:appgroup \
     /app/target/servidor-notificaciones-1.0.0.jar \
     app.jar

USER appuser

EXPOSE 8083

ENV PORT=8083

# Health check usando wget (disponible en alpine)
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:8083/health || exit 1

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
