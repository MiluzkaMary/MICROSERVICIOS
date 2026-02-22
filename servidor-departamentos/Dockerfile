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

# Copiar código fuente
COPY . .

# Aquí se pueden agregar pasos de build/test en el futuro
# Por ejemplo: RUN npm run build, RUN npm test, etc.

# ============================================
# ETAPA 3: Producción
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=builder /app .

EXPOSE 3001

CMD ["node", "index.js"]
