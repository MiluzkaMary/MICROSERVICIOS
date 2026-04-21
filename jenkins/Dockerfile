# ============================================================
# Jenkins con Docker-in-Docker support
# Base: jenkins/jenkins:lts-jdk17
# ============================================================
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

# Agregar usuario jenkins al grupo docker para poder usar el socket sin sudo
RUN groupadd -f docker && usermod -aG docker jenkins

# Volver al usuario jenkins
USER jenkins

# Omitir el wizard de setup inicial
ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false"

# Pre-instalar plugins usando jenkins-plugin-cli
# (incluido en la imagen base desde Jenkins 2.346+)
RUN jenkins-plugin-cli --plugins \
    # ── Core Pipeline ──
    workflow-aggregator \
    # ── Docker ──
    docker-workflow \
    docker-plugin \
    # ── Git ──
    git \
    github \
    # ── Credenciales & Seguridad ──
    credentials-binding \
    ssh-credentials \
    # ── Calidad de código ──
    jacoco \
    htmlpublisher \
    # ── UI & Reporte ──
    blueocean \
    ansicolor \
    timestamper \
    # ── Utilidades ──
    matrix-auth \
    role-strategy \
    job-dsl \
    build-timeout \
    ws-cleanup
