# Imagen base de Node.js 20 Alpine
FROM node:20-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar código fuente
COPY . .

# Usuario no privilegiado
USER node

# Exponer puerto
EXPOSE 8084

# Comando de inicio
CMD ["npm", "start"]
