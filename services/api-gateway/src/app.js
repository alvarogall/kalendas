const express = require('express')
const cors = require('cors')
const { createProxyMiddleware } = require('http-proxy-middleware')
const config = require('./utils/config')
const logger = require('./utils/logger')

const app = express()

app.use(cors())

// Mount DropBox helper routes (server-side Dropbox uploads/delete)
const dropboxRouter = require('./routes/dropbox')
app.use('/api/dropbox', dropboxRouter)

app.use((req, _res, next) => {
  logger.info('Gateway', req.method, req.path)
  next()
})

const makeProxy = (target) => createProxyMiddleware({
  target,
  changeOrigin: true,
  proxyTimeout: 10000,
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Proxying ${req.method} ${req.path} to ${target}`)
  },
  onError: (err, req, res) => {
    logger.error('Proxy error:', err.message)
    if (!res.headersSent) {
      res.status(502).json({ error: 'Bad gateway', service: target })
    }
  }
})

logger.info('Setting up proxies:')
logger.info('  /api/calendars -> ' + config.CALENDAR_SERVICE_URL)
logger.info('  /api/events -> ' + config.EVENT_SERVICE_URL)
logger.info('  /api/comments -> ' + config.COMMENT_SERVICE_URL)
logger.info('  /api/notifications -> ' + config.NOTIFICATION_SERVICE_URL)

app.use('/api/calendars', makeProxy(config.CALENDAR_SERVICE_URL + '/api/calendars'))
app.use('/api/events', makeProxy(config.EVENT_SERVICE_URL + '/api/events'))
app.use('/api/comments', makeProxy(config.COMMENT_SERVICE_URL + '/api/comments'))
app.use('/api/notifications', makeProxy(config.NOTIFICATION_SERVICE_URL + '/api/notifications'))

app.use((req, res) => {
  res.status(404).json({ error: 'unknown endpoint' })
})

module.exports = app
