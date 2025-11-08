FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm install --only=production

# Copiar código fuente
COPY . .

# Variables de entorno
ENV NODE_ENV=production

# Exponer puerto
EXPOSE 3004

# Comando de inicio
CMD ["node", "src/index.js"]
