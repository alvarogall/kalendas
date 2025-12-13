# Kalendas - Plataforma de Gestión de Calendarios y Eventos

Kalendas es una aplicación web distribuida diseñada para la gestión colaborativa de calendarios y eventos. Desarrollada bajo una arquitectura de microservicios, permite a los usuarios crear, organizar y compartir eventos de manera eficiente, integrando funcionalidades avanzadas como geolocalización, almacenamiento en la nube y notificaciones.

## 🚀 Características Principales

*   **Gestión de Calendarios:** Creación, edición y eliminación de múltiples calendarios personales y compartidos.
*   **Eventos Ricos:** Soporte para eventos con ubicación geográfica (mapas interactivos), imágenes de portada y archivos adjuntos.
*   **Colaboración:** Sistema de comentarios en tiempo real para discutir detalles de los eventos.
*   **Integraciones Externas:**
    *   **Google OAuth:** Autenticación segura y gestión de sesiones.
    *   **Cloudinary:** Alojamiento optimizado de imágenes.
    *   **Dropbox:** Almacenamiento de documentos y archivos adjuntos.
    *   **OpenStreetMap:** Visualización de ubicaciones mediante mapas interactivos.
*   **Importación:** Capacidad para importar calendarios externos en formato `.ics` (Google Calendar, Outlook, etc.).
*   **Notificaciones:** Sistema de alertas para recordatorios de eventos.

## 🏗️ Arquitectura del Sistema

El proyecto sigue una arquitectura de microservicios contenerizada con Docker:

*   **Frontend (Webapp):** SPA desarrollada en React + Vite + Material UI.
*   **API Gateway:** Punto de entrada único que enruta las peticiones a los servicios correspondientes.
*   **Microservicios:**
    *   `calendar-service`: Gestión del ciclo de vida de los calendarios.
    *   `event-service`: Lógica de eventos, ubicaciones y fechas.
    *   `comment-service`: Gestión de hilos de comentarios.
    *   `notification-service`: Motor de envío de notificaciones.
*   **Base de Datos:** MongoDB (instancia compartida o por servicio según configuración).

## 🛠️ Tecnologías Utilizadas

*   **Backend:** Node.js, Express.
*   **Frontend:** React, Leaflet (Mapas), Axios.
*   **Infraestructura:** Docker, Docker Compose.
*   **Autenticación:** Google OAuth 2.0.

## 📦 Instalación y Despliegue

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/alvarogall/kalendas.git
    cd kalendas
    ```

2.  **Configurar variables de entorno:**
    Asegúrate de tener los archivos `.env` necesarios en la carpeta `deployment/config/env/` o `deployment/env/` según tu configuración de Docker Compose.

3.  **Desplegar con Docker Compose:**
    ```bash
    cd deployment
    docker compose up --build -d
    ```

4.  **Acceder a la aplicación:**
    Abre tu navegador en `http://localhost:5173` (o el puerto configurado para el frontend).

## 👥 Autores

Proyecto desarrollado para la asignatura de Ingeniería Web.
