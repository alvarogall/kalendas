#!/bin/bash
# Script de despliegue de Kalendas con Docker

set -e

# Ir al directorio raíz del proyecto (3 niveles arriba desde scripts)
cd "$(dirname "$0")/../../.."

echo "🚀 Desplegando Kalendas con Docker..."
echo ""

# Verificar archivos .env
MISSING_ENV=0
for service in gateway calendar event comment notification; do
    if [ ! -f "deployment/config/env/${service}.env" ]; then
        echo "❌ Falta: deployment/config/env/${service}.env"
        MISSING_ENV=1
    fi
done

if [ $MISSING_ENV -eq 1 ]; then
    echo ""
    echo "💡 Crea los archivos .env en deployment/config/env/ con tus credenciales:"
    echo "   - gateway.env (GATEWAY_PORT, *_SERVICE_URL)"
    echo "   - calendar.env (PORT, MONGODB_URI, *_SERVICE_URL)"
    echo "   - event.env (PORT, MONGODB_URI, *_SERVICE_URL)"
    echo "   - comment.env (PORT, MONGODB_URI, *_SERVICE_URL)"
    echo "   - notification.env (PORT, MONGODB_URI, SMTP_*, *_SERVICE_URL)"
    exit 1
fi

# Construir y levantar
cd deployment
echo "📦 Construyendo imágenes..."
docker-compose build

echo ""
echo "🐳 Levantando contenedores..."
docker-compose up -d

echo ""
echo "✅ Kalendas desplegado!"
echo ""
echo "📍 API Gateway: http://localhost:8080"
echo "📊 Ver logs:    docker-compose logs -f"
echo "🛑 Detener:     docker-compose down"
echo ""
