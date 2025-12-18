const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
const { createProxyMiddleware } = require('http-proxy-middleware')
const config = require('./utils/config')
const logger = require('./utils/logger')

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))

app.use(express.json())
app.use(cookieParser())

app.use((req, _res, next) => {
  logger.info('Gateway', req.method, req.path)
  next()
})

const client = new OAuth2Client(config.GOOGLE_CLIENT_ID)
const JWT_SECRET = process.env.JWT_SECRET || 'secret_para_desarrollo'

app.post('/api/auth/login', async (req, res) => {
  const { token } = req.body
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: config.GOOGLE_CLIENT_ID
    })
    const payload = ticket.getPayload()
    const email = payload.email

    const isAdmin = email === 'pruebaparaingweb@gmail.com'

    const appToken = jwt.sign(
      { id: payload.sub, email, name: payload.name, isAdmin },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.cookie('auth_token', appToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000
    })

    res.json({ email, name: payload.name, isAdmin, message: 'Sesión iniciada' })
  } catch (error) {
    logger.error('Auth Error:', error.message)
    res.status(401).json({ error: 'Token inválido' })
  }
})

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token', { sameSite: 'none', secure: true })
  res.status(200).json({ message: 'Logout exitoso' })
})

app.get('/api/token', (req, res) => {
  const token = req.cookies.auth_token
  if (!token) return res.status(401).json({ error: 'No autenticado' })
  res.json({ token })
})

const addAuthHeader = (proxyReq, req) => {
  if (req.cookies.auth_token) {
    proxyReq.setHeader('Authorization', `Bearer ${req.cookies.auth_token}`)
  }
}

const makeProxy = (target, apiPrefix) => createProxyMiddleware({
  target,
  changeOrigin: true,
  onProxyReq: addAuthHeader,
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
app.use('/api/events', requireTarget('EVENT_SERVICE_URL', config.EVENT_SERVICE_URL, '/api/events'))
app.use('/api/comments', requireTarget('COMMENT_SERVICE_URL', config.COMMENT_SERVICE_URL, '/api/comments'))
app.use('/api/notifications', requireTarget('NOTIFICATION_SERVICE_URL', config.NOTIFICATION_SERVICE_URL, '/api/notifications'))

app.use((req, res) => {
  res.status(404).json({ error: 'unknown endpoint' })
})

module.exports = app