# ============================================================
# Jenkins con Docker-in-Docker support
# Base: jenkins/jenkins:lts-jdk17
# ============================================================
FROM golang:1.22-alpine AS golang

FROM jenkins/jenkins:lts-jdk17

# Cambiar a root para instalar dependencias del sistema
USER root

# Instalar Docker CLI (cliente) para poder construir imágenes desde Jenkins
RUN apt-get update && \
    apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release && \
    # Agregar clave GPG oficial de Docker
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc && \
    chmod a+r /etc/apt/keyrings/docker.asc && \
    # Agregar repositorio Docker
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    # Instalar solo docker-ce-cli (no el daemon, usamos el del host)
    apt-get install -y docker-ce-cli && \
    # Limpiar cache para reducir tamaño de imagen
    rm -rf /var/lib/apt/lists/*

# Instalar Node.js 18 para ejecutar pipelines de servicios Node
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Instalar Python y utilidades de testing para pipelines Python
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv && \
    pip3 install --break-system-packages pytest pytest-cov && \
    rm -rf /var/lib/apt/lists/*

# Instalar Go 1.22 para compilar servidor-perfiles sin depender de descargas externas en build
COPY --from=golang /usr/local/go /usr/local/go
ENV PATH="${PATH}:/usr/local/go/bin"

# Instalar Maven para compilar servidor-notificaciones
RUN apt-get update && \
    apt-get install -y maven && \
    rm -rf /var/lib/apt/lists/*

# Instalar SonarScanner CLI para que pipelines (no sólo Maven) puedan ejecutar análisis
RUN apt-get update && \
    apt-get install -y unzip && \
    SONAR_VERSION=4.8.0.2856 && \
    curl -sSL https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-${SONAR_VERSION}-linux.zip -o /tmp/sonar-scanner.zip && \
    unzip /tmp/sonar-scanner.zip -d /opt && \
    mv /opt/sonar-scanner-${SONAR_VERSION}-linux /opt/sonar-scanner || true && \
    ln -s /opt/sonar-scanner/bin/sonar-scanner /usr/local/bin/sonar-scanner || true && \
    rm /tmp/sonar-scanner.zip && \
    rm -rf /var/lib/apt/lists/*

# Agregar usuario jenkins al grupo docker para poder usar el socket sin sudo
RUN groupadd -f docker && usermod -aG docker jenkins

# Volver al usuario jenkins
USER jenkins

# Omitir el wizard 
ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false"

# Pre-instalar plugins usando jenkins-plugin-cli.
# En entornos sin resolución a updates.jenkins.io, esta etapa se omite para no bloquear el build.
RUN jenkins-plugin-cli --plugins \
    workflow-aggregator \
    pipeline-stage-view \
    docker-workflow \
    docker-plugin \
    git \
    github \
    credentials-binding \
    ssh-credentials \
    jacoco \
    htmlpublisher \
    sonar \
    configuration-as-code \
    blueocean \
    ansicolor \
    timestamper \
    matrix-auth \
    role-strategy \
    job-dsl \
    build-timeout \
    ws-cleanup || true
