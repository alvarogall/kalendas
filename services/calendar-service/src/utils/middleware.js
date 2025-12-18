const logger = require('./logger')
const jwt = require('jsonwebtoken')

const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method)
  logger.info('Path:  ', request.path)
  next()
}

const tokenExtractor = (request, response, next) => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    try {
      const token = authorization.substring(7)
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'secret_para_desarrollo')
      request.user = decodedToken
    } catch (error) {
      logger.error('Token inválido')
    }
  }
  next()
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)
  if (error.name === 'CastError') return response.status(400).send({ error: 'malformatted id' })
  if (error.name === 'ValidationError') return response.status(400).json({ error: error.message })
  next(error)
}

module.exports = { requestLogger, unknownEndpoint, errorHandler, tokenExtractor }