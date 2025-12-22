const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
const { createProxyMiddleware } = require('http-proxy-middleware')
const config = require('./utils/config')
const logger = require('./utils/logger')

const app = express()

const normalizeOrigin = (raw) => {
  if (!raw) return ''
  const v = String(raw).trim().replace(/\/+$/, '')
  if (!v) return ''
  if (v.startsWith('http://') || v.startsWith('https://')) {
    try {
      return new URL(v).origin
    } catch (_err) {
      return v
    }
  }
  return v
}

const getAllowedOrigins = () => {
  const raw = process.env.FRONTEND_URL || 'http://localhost:5173'
  return String(raw)
    .split(',')
    .map(s => normalizeOrigin(s))
    .filter(Boolean)
}

const allowedOrigins = [
  'http://localhost:5173',                   // Local Frontend
  'http://localhost:4173',                   // Local Preview
  'https://kalendas-frontend.onrender.com'   // TU DOMINIO REAL EN RENDER
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir peticiones sin origen (como curl o postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true, // Esto es OBLIGATORIO para que viajen las cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// app.use(express.json()) // Removed global json parsing to avoid consuming proxy streams
app.use(cookieParser())

app.use((req, _res, next) => {
  logger.info('Gateway', req.method, req.path)
  next()
})

const client = new OAuth2Client(config.GOOGLE_CLIENT_ID)
const JWT_SECRET = process.env.JWT_SECRET || 'secret_para_desarrollo'

app.post('/api/auth/login', express.json(), async (req, res) => {
  const { token } = req.body
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: config.GOOGLE_CLIENT_ID
    })
    const payload = ticket.getPayload()
    const email = payload.email

    const adminEmail = process.env.ADMIN_EMAIL
    const isAdmin = email === adminEmail

    const appToken = jwt.sign(
      { id: payload.sub, email, name: payload.name, isAdmin },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const isLocalhost = (() => {
      try {
        const u = new URL(frontendUrl)
        return u.hostname === 'localhost' || u.hostname === '127.0.0.1'
      } catch (_err) {
        return false
      }
    })()

    // Local dev runs on plain HTTP, so Secure cookies would be dropped by the browser.
    // Also, localhost across different ports is still "same-site", so SameSite=Lax is fine.
    const cookieOptions = isLocalhost
      ? { httpOnly: true, secure: false, sameSite: 'lax' }
      : { httpOnly: true, secure: true, sameSite: 'none' }

    res.cookie('auth_token', appToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000
    })

    // Also return token so clients can use Authorization header if cookies are not available.
    res.json({ email, name: payload.name, isAdmin, token: appToken, message: 'Sesión iniciada' })
  } catch (error) {
    logger.error('Auth Error:', error.message)
    res.status(401).json({ error: 'Token inválido' })
  }
})

app.post('/api/auth/logout', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const isLocalhost = (() => {
    try {
      const u = new URL(frontendUrl)
      return u.hostname === 'localhost' || u.hostname === '127.0.0.1'
    } catch (_err) {
      return false
    }
  })()
  const cookieOptions = isLocalhost
    ? { secure: false, sameSite: 'lax' }
    : { secure: true, sameSite: 'none' }

  res.clearCookie('auth_token', cookieOptions)
  res.status(200).json({ message: 'Logout exitoso' })
})

app.get('/api/token', (req, res) => {
  const token = req.cookies.auth_token
  if (!token) return res.status(401).json({ error: 'No autenticado' })
  res.json({ token })
})

const addAuthHeader = (proxyReq, req) => {
  // If client already sent Authorization, keep it.
  if (req.headers.authorization) return
  if (req.cookies.auth_token) {
    proxyReq.setHeader('Authorization', `Bearer ${req.cookies.auth_token}`)
  }
}

const applyGatewayCorsToProxyResponse = (proxyRes, req) => {
  // Downstream services often do `app.use(cors())` which sets ACAO='*'.
  // That breaks requests with credentials (cookies) from the browser.
  // We strip downstream CORS headers and re-apply gateway-controlled headers.
  delete proxyRes.headers['access-control-allow-origin']
  delete proxyRes.headers['access-control-allow-credentials']
  delete proxyRes.headers['access-control-allow-headers']
  delete proxyRes.headers['access-control-allow-methods']
  delete proxyRes.headers['access-control-expose-headers']

  const origin = normalizeOrigin(req.headers.origin)
  if (!origin) return

  const allowed = getAllowedOrigins()
  if (!allowed.includes(origin)) return

  proxyRes.headers['access-control-allow-origin'] = origin
  proxyRes.headers['access-control-allow-credentials'] = 'true'
  // Help caches behave correctly with per-origin responses
  const vary = proxyRes.headers.vary
  proxyRes.headers.vary = vary ? `${vary}, Origin` : 'Origin'
}

const makeProxy = (target, apiPrefix) => createProxyMiddleware({
  target,
  changeOrigin: true,
  onProxyReq: addAuthHeader,
  onProxyRes: applyGatewayCorsToProxyResponse,
  // IMPORTANT: Express strips the mount path from req.url for mounted middleware.
  // We need to re-prepend the prefix so downstream services (which mount /api/...) receive correct paths.
  pathRewrite: (path) => `${apiPrefix}${path}`,
  onError: (err, req, res) => {
    logger.error('Proxy error:', err.message)
    if (!res.headersSent) res.status(502).json({ error: 'Bad gateway', service: target })
  }
})

const dropboxRouter = require('./routes/dropbox')

app.use('/api/dropbox', dropboxRouter)

const healthPayload = () => ({
  status: 'ok',
  gateway: {
    googleClientIdConfigured: Boolean(config.GOOGLE_CLIENT_ID),
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    renderGitCommit: process.env.RENDER_GIT_COMMIT,
    renderServiceName: process.env.RENDER_SERVICE_NAME
  },
  services: {
    calendars: config.CALENDAR_SERVICE_URL,
    events: config.EVENT_SERVICE_URL,
    comments: config.COMMENT_SERVICE_URL,
    notifications: config.NOTIFICATION_SERVICE_URL
  },
  servicesRaw: config.__raw
})

app.get('/health', (_req, res) => {
  res.json(healthPayload())
})

app.get('/api/health', (_req, res) => {
  res.json(healthPayload())
})

app.get('/api/version', (_req, res) => {
  res.json({
    name: 'api-gateway',
    renderGitCommit: process.env.RENDER_GIT_COMMIT,
    renderServiceName: process.env.RENDER_SERVICE_NAME
  })
})

const requireTarget = (name, target, apiPrefix) => {
  if (target) return makeProxy(target, apiPrefix)
  logger.error(`Missing ${name} target URL (env var not set).`)
  return (_req, res) => res.status(500).json({ error: 'Service misconfigured', service: name })
}

app.use('/api/calendars', requireTarget('CALENDAR_SERVICE_URL', config.CALENDAR_SERVICE_URL, '/api/calendars'))
app.use('/api/preferences', requireTarget('CALENDAR_SERVICE_URL', config.CALENDAR_SERVICE_URL, '/api/preferences'))
app.use('/api/events', requireTarget('EVENT_SERVICE_URL', config.EVENT_SERVICE_URL, '/api/events'))
app.use('/api/comments', requireTarget('COMMENT_SERVICE_URL', config.COMMENT_SERVICE_URL, '/api/comments'))
app.use('/api/notifications', requireTarget('NOTIFICATION_SERVICE_URL', config.NOTIFICATION_SERVICE_URL, '/api/notifications'))

app.use((req, res) => {
  res.status(404).json({ error: 'unknown endpoint' })
})

module.exports = app