require('dotenv').config()

const PORT = process.env.PORT

const MONGODB_URI = process.env.MONGODB_URI

const EVENT_SERVICE_URL = process.env.EVENT_SERVICE_URL
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL

module.exports = {
  MONGODB_URI,
  PORT,
  EVENT_SERVICE_URL,
  NOTIFICATION_SERVICE_URL
}