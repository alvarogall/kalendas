const app = require('./app')
const config = require('./utils/config')
const logger = require('./utils/logger')

app.listen(config.PORT, () => {
  logger.info(`API Gateway listening on port ${config.PORT}`)
  logger.info(`Proxying Calendars to: ${config.CALENDAR_SERVICE_URL}`)
  logger.info(`Proxying Events to: ${config.EVENT_SERVICE_URL}`)
  logger.info(`Proxying Comments to: ${config.COMMENT_SERVICE_URL}`)
  logger.info(`Proxying Notifications to: ${config.NOTIFICATION_SERVICE_URL}`)
})
