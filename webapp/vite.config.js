import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy API requests to the API Gateway. Inside Docker this resolves to the
    // `api-gateway` service; when running Vite locally you can override this
    // by setting the env var VITE_API_PROXY (e.g. to http://localhost:8080).
    proxy: {
      '^/api': {
        target: process.env.VITE_API_PROXY || 'http://api-gateway:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
})
