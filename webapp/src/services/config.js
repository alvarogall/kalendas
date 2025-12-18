let url = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

if (url.endsWith('/')) {
  url = url.slice(0, -1)
}

if (!url.endsWith('/api')) {
  url += '/api'
}

export const apiBaseUrl = url

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '674155688412-d37rtg64ds72skirp56smmbb80go0uqb.apps.googleusercontent.com'
export const googleClientId = clientId.trim()

