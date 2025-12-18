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
      audience: process.env.GOOGLE_CLIENT_ID
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

const makeProxy = (target) => createProxyMiddleware({
  target,
  changeOrigin: true,
  onProxyReq: addAuthHeader,
  pathRewrite: {
  },
  onError: (err, req, res) => {
    logger.error('Proxy error:', err.message)
    if (!res.headersSent) res.status(502).json({ error: 'Bad gateway', service: target })
  }
})

app.use('/api/calendars', makeProxy(config.CALENDAR_SERVICE_URL))
app.use('/api/events', makeProxy(config.EVENT_SERVICE_URL))
app.use('/api/comments', makeProxy(config.COMMENT_SERVICE_URL))
app.use('/api/notifications', makeProxy(config.NOTIFICATION_SERVICE_URL))

app.use((req, res) => {
  res.status(404).json({ error: 'unknown endpoint' })
})

module.exports = app