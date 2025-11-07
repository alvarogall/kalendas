FROM node:18-alpine

WORKDIR /app

# InstalaR dependencias primero copiando package.json
COPY package*.json ./
RUN npm ci --only=production

# Copia el código
COPY . .

ENV NODE_ENV=production

# PUERTO
EXPOSE 3003

CMD ["node", "src/index.js"]