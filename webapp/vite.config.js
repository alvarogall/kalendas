import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({ jsxRuntime: 'automatic' })],
  server: {
    host: true,
    headers: {
      // Esta es la clave para que Google Login funcione y no bloquee el popup
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      // Esta a veces es necesaria si usas SharedArrayBuffer, si no, puedes probar sin ella, 
      // pero para evitar problemas déjala en unsafe-none o credentialless
      'Cross-Origin-Embedder-Policy': 'unsafe-none' 
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY || 'http://api-gateway:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  },
  // AÑADE ESTO TAMBIÉN PARA PRODUCCIÓN (RENDER)
  preview: {
    host: true,
    port: 4173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    }
  }
})