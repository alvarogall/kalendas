FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Variables de entorno
ENV NODE_ENV=production

# Exponer puerto
EXPOSE 8080

# Comando de inicio
CMD ["node", "src/index.js"]
