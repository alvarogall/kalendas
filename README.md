# Kalendas: aplicación web de calendarios de eventos

**Asignatura:** Ingeniería Web 2025/26  
**Centro:** Departamento de Lenguajes y Ciencias de la Computación  
**Grupo:** Grupo 2E

## Integrantes
- Miguel Carmona Cabello
- Álvaro Gallardo Rubio
- Pablo Gálvez Castillo
- Pablo Gámez Guerrero
- Máximo Prados Meléndez
- Jesús Repiso Río

## URLs de despliegue en la nube
- **Frontend (Render):** https://kalendas-frontend.onrender.com
- **API Gateway (Render):** https://kalendas-gateway-8i8x.onrender.com

## Tecnologías utilizadas

### Frontend
- React + Vite
- UI/UX: componentes propios + Tailwind CSS
- Calendario: `react-big-calendar`
- Fechas: `date-fns`
- Mapas: Leaflet / React-Leaflet (OpenStreetMap)
- HTTP: Axios
- OAuth en cliente: `@react-oauth/google`

### Backend
- Node.js + Express
- API Gateway con `http-proxy-middleware`
- Autenticación: Google OAuth2 (verificación de ID token) + JWT del gateway
- Persistencia: MongoDB (vía Mongoose)

### Infraestructura y despliegue
- Docker y Docker Compose para ejecución local
- Render como proveedor cloud (frontend y servicios backend)
- MongoDB Atlas como servicio de base de datos (cluster en la nube)

## Funcionalidad

### Gestión de calendarios y eventos
- CRUD de calendarios y eventos vía API REST.
- Jerarquía de calendarios mediante `parentId` y `subCalendars`.
- Visualización en calendario (mes/semana/día) en la SPA.

### Búsqueda y selección de calendarios
- Filtros de búsqueda por criterios (título, organizador, fechas, etc.) desde la UI.
- Preferencias persistidas de calendarios seguidos/seleccionados (colección por usuario).

### Integración con mapas
- Ubicación de eventos representable en mapa mediante coordenadas opcionales.
- Uso de OpenStreetMap como proveedor de tiles.

### Comentarios y notificaciones
- Comentarios asociados a eventos.
- Notificaciones in-app y por email (según canal).

### Importación de calendarios ICS
- Importación desde URL ICS y sincronización posterior usando la URL persistida.

### Seguridad y permisos
- Modo invitado (guest) de solo lectura.
- Restricciones de modificación (CRUD) en base al email propietario.
- Soporte de token en header o cookie para compatibilidad con despliegues cross-origin.

## Arquitectura

La arquitectura sigue un enfoque de microservicios con un API Gateway como *entrypoint*:

- **Webapp (SPA):** UI en React que consume el gateway.
- **API Gateway:** punto único de entrada, autenticación y proxy a los servicios.
- **Servicios de dominio:** `calendar-service`, `event-service`, `comment-service`, `notification-service`.
- **MongoDB Atlas:** persistencia común (colecciones por entidad).

### Flujos principales
- **Login:** el cliente obtiene un ID token de Google y lo envía al gateway; el gateway emite un JWT.
- **CRUD:** el cliente llama al gateway con JWT; el gateway reenvía al microservicio correspondiente.
- **Import ICS:** `calendar-service` descarga el ICS, lo parsea y crea eventos en el `event-service`.
- **Notificaciones:** `notification-service` genera notificaciones in-app y/o envía correo (SMTP).

## Modelo de datos (MongoDB)

Entidades principales persistidas:

- **Calendar:** Título, organizador, fechas, jerarquía (subcalendarios), URL fuente (ICS).
- **Event:** Título, fechas, ubicación (texto + coordenadas), organizador, imágenes (Cloudinary), adjuntos (Dropbox).
- **Comment:** Texto, usuario, asociado a evento.
- **Notification:** Canal (email/in-app), destinatario, mensaje, estado de envío.
- **UserPreference:** Calendarios seguidos y seleccionados por usuario.

## API REST

### Documentación OpenAPI
La especificación OpenAPI del gateway se encuentra en `services/api-gateway/docs/openapi.yaml`.
Existe una UI local de Swagger en `services/api-gateway/docs/swagger-ui.html`.

### Autenticación
- `POST /api/auth/login`: Login Google + JWT.
- `POST /api/auth/logout`: Logout.
- `GET /api/token`: Obtener token actual.

### Recursos principales
- Calendarios: `/api/calendars`
- Preferencias: `/api/preferences`
- Eventos: `/api/events`
- Comentarios: `/api/comments`
- Notificaciones: `/api/notifications`
- Archivos: `/api/dropbox/upload`

## Servicios externos

- **Google OAuth 2.0:** Autenticación de usuarios.
- **Cloudinary:** Almacenamiento de imágenes de portada de eventos.
- **Dropbox:** Almacenamiento de archivos adjuntos.
- **OpenStreetMap:** Visualización de mapas interactivos.
- **Correo (SMTP):** Envío de notificaciones por email.
  > **Nota:** La funcionalidad de envío de correos opera correctamente en local. En el despliegue cloud (Render Free Tier), los puertos SMTP suelen estar bloqueados, lo que puede causar errores de timeout.

## Instalación y despliegue

### Ejecución local

```bash
cd deployment
docker-compose up --build -d
```

### Despliegue en la nube (Render)
La aplicación se despliega en Render separando frontend y backend.

## Variables de entorno

Las variables de entorno para ejecución local se encuentran en `deployment/config/env/`.
Para el despliegue cloud, se configuran en el panel de Render.

**URI de MongoDB:**
```
MONGODB_URI=mongodb+srv://grupo2e:1Ulfx8z105cLZ3O0@kalendas.ndlyw4p.mongodb.net/?retryWrites=true&w=majority
```
