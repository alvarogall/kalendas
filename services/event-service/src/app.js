const config = require('./utils/config')
const express = require('express')
const app = express()
const cors = require('cors')
const eventsRouter = require('./controllers/events')
const middleware = require('./utils/middleware')
const logger = require('./utils/logger')
const mongoose = require('mongoose')

mongoose.set('strictQuery', false)

logger.info('connecting to', config.MONGODB_URI)

mongoose.connect(config.MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB')
  })
  .catch((error) => {
    logger.error('Error connecting to MongoDB:', error.message)
  })

app.use(cors())
app.use(express.static('dist'))
// Increase JSON body size to allow base64 image uploads from the frontend (default is ~100kb)
app.use(express.json({ limit: '10mb' }))
app.use(middleware.requestLogger)

app.use('/api/events', eventsRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app