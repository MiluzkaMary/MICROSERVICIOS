# ============================================
# ETAPA 1: Dependencias
# Instala todas las dependencias (prod + dev)
# ============================================
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copiar solo package files para aprovechar caché de Docker
COPY package*.json ./

# Instalar todas las dependencias
RUN npm ci --prefer-offline --no-audit

# ============================================
# ETAPA 2: Builder
# Preparación y validación del código
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar node_modules de la etapa anterior
COPY --from=dependencies /app/node_modules ./node_modules

# Copiar código fuente específicamente
COPY package*.json ./
COPY index.js ./
COPY src/ ./src/

# Aquí se pueden agregar pasos de build/test en el futuro
# Por ejemplo: RUN npm run build, RUN npm test, etc.

FROM node:20-alpine AS production

# Crear usuario no privilegiado para seguridad
# Crea un nuevo grupo de sistema (S) llamado "nodejs" con ID de grupo (GID) 1001.
# Este grupo se utiliza para ejecutar procesos del contenedor con permisos limitados
# en lugar de usar el usuario root, mejorando la seguridad del contenedor.
# El parámetro -g especifica el GID y -S indica que es un grupo de sistema.
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar SOLO dependencias de producción
RUN npm ci --omit=dev --prefer-offline --no-audit && \
    npm cache clean --force

# Copiar el código fuente con permisos correctos
COPY --chown=nodejs:nodejs src/ ./src/
COPY --chown=nodejs:nodejs index.js ./

# Cambiar al usuario no privilegiado
USER nodejs

# Exponer puerto
EXPOSE 8080

# Variables de entorno
ENV PORT=8080 \
    NODE_ENV=production

# Healthcheck para monitoreo
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio (usando node directamente es más eficiente)
CMD ["node", "index.js"]
