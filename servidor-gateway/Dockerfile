# Imagen base de Node.js 20 Alpine
FROM node:20-alpine

# Establecer directorio de trabajo
WORKDIR /usr/src/app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar archivos de configuración y entrada
COPY config/ ./config/
COPY server.js ./

# Usuario no privilegiado
USER node

# Exponer puerto del gateway
EXPOSE 8085

# Variables de entorno
ENV PORT=8085

# Comando de inicio
CMD ["node", "server.js"]
