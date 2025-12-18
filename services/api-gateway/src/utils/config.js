require('dotenv').config()

module.exports = {
  PORT: process.env.PORT || process.env.GATEWAY_PORT || 10000,
  CALENDAR_SERVICE_URL: process.env.CALENDAR_SERVICE_URL,
  EVENT_SERVICE_URL: process.env.EVENT_SERVICE_URL,
  COMMENT_SERVICE_URL: process.env.COMMENT_SERVICE_URL,
  NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL
}