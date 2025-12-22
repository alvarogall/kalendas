
# Kalendas

Kalendas es una aplicación web para **gestión de calendarios de eventos** (creación, visualización, importación y colaboración), desarrollada como caso de estudio de *Ingeniería Web 2025/26*.

El proyecto está organizado en **microservicios** (Node.js/Express) detrás de un **API Gateway**, y un cliente web SPA en React.

## Funcionalidad

- Calendarios: crear/editar/eliminar, búsqueda por criterios y relaciones jerárquicas (subcalendarios).
- Eventos: crear/editar/eliminar, con ubicación y soporte de mapa.
- Comentarios en eventos.
- Notificaciones asociadas a comentarios.
- Importación de calendarios externos en formato **ICS**.
- Autenticación con **OAuth 2.0 (Google)**.

## Arquitectura (alto nivel)

- **Webapp** (React + Vite) → consume la API vía Gateway.
- **API Gateway** (Express) → autentica (login/logout), emite JWT de la aplicación y hace de proxy hacia los microservicios.
- **Microservicios**:
  - `calendar-service`: calendarios, subcalendarios, importación/sincronización ICS y preferencias.
  - `event-service`: CRUD de eventos y consultas.
  - `comment-service`: CRUD de comentarios (el borrado está deshabilitado).
  - `notification-service`: creación/listado de notificaciones.

## Tecnologías

- **Frontend**: React + Vite, Axios, React Big Calendar, date-fns, Leaflet/React-Leaflet.
- **Backend**: Node.js, Express.
- **Persistencia**: MongoDB (vía Mongoose en los servicios).
- **Auth**: Google OAuth (cliente) + JWT propio (gateway).
- **Infraestructura local**: Docker + Docker Compose.

## Estructura del repositorio

- `services/` → microservicios + gateway
- `webapp/` → cliente React
- `deployment/` → `docker-compose.yml` y variables de entorno por servicio

## Arranque en local (Docker)

Requisitos:

- Docker
- docker-compose (legacy) o Docker Compose plugin

1) Variables de entorno

Los contenedores cargan variables desde `deployment/config/env/*.env`.

2) Levantar el stack

```bash
cd deployment
docker-compose up --build -d
```

Si tu usuario no tiene permisos sobre Docker, usa `sudo`:

```bash
cd deployment
sudo docker-compose up --build -d
```

3) URLs locales

- Web: http://localhost:5173
- API Gateway: http://localhost:8080
- Swagger UI (docs del gateway): http://localhost:8080/docs (si está expuesto) o `services/api-gateway/docs/swagger-ui.html`

## Autenticación y token (requisito Cloud)

El login se realiza con Google OAuth desde el cliente. El gateway emite un JWT para el resto de llamadas.

- `POST /api/auth/login` (recibe el ID token de Google)
- `POST /api/auth/logout`

Para facilitar pruebas en Swagger/Postman, el gateway expone:

- `GET /api/token` → devuelve `{ "token": "..." }` si existe sesión.

Ejemplo de uso:

```bash
TOKEN="<token>"
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/calendars
```

## Documentación de la API

La especificación OpenAPI del gateway está en:

- `services/api-gateway/docs/openapi.yaml`

El Swagger UI está en:

- `services/api-gateway/docs/swagger-ui.html`

## Notas de desarrollo

- El gateway aplica CORS y reescribe respuestas de CORS para que el navegador pueda trabajar con credenciales.
- Los servicios se comunican entre sí usando las URLs internas del `docker-compose` (por ejemplo `http://calendar-service:3001`).

## Verificación rápida (smoke test)

```bash
curl http://localhost:8080/health
curl http://localhost:8080/api/health
curl http://localhost:8080/api/version
```
