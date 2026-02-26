# ============================================
# ETAPA 1: Dependencias
# ============================================
FROM node:20-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm ci --prefer-offline --no-audit

# ============================================
# ETAPA 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules

COPY package*.json ./
COPY index.js ./
COPY src/ ./src/

# ============================================
# ETAPA 3: Producción
# ============================================
FROM node:20-alpine AS production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev --prefer-offline --no-audit && \
    npm cache clean --force

COPY --chown=nodejs:nodejs src/ ./src/
COPY --chown=nodejs:nodejs index.js ./

USER nodejs

EXPOSE 8083

ENV PORT=8083 \
    NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8083/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "index.js"]
