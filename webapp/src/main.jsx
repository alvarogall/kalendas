import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import './index.css'
import axios from 'axios'

const rawApiUrl = import.meta.env.VITE_API_URL || ''
// Cookie-based auth only works reliably when API is same-origin (e.g. VITE_API_URL="/api").
// When API is cross-origin (Render static site -> gateway web service), use token auth (no cookies).
axios.defaults.withCredentials = String(rawApiUrl).trim().startsWith('/')

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "TU_CLIENT_ID_DE_GOOGLE";

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={clientId}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </GoogleOAuthProvider>,
)