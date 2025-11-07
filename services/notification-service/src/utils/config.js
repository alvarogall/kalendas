require('dotenv').config()

const PORT = process.env.PORT
const MONGODB_URI = process.env.MONGODB_URI

const SMTP_PORT = process.env.SMTP_PORT
const SMTP_SECURE = process.env.SMTP_SECURE
const EMAIL_FROM = process.env.EMAIL_FROM

const DISPATCH_INTERVAL_MS = process.env.DISPATCH_INTERVAL_MS
const RETENTION_DAYS = process.env.RETENTION_DAYS

const CALENDAR_SERVICE_URL = process.env.CALENDAR_SERVICE_URL
const EVENT_SERVICE_URL = process.env.EVENT_SERVICE_URL

const SMTP_HOST = process.env.SMTP_HOST
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS

module.exports = {
    PORT,
    MONGODB_URI,
    SMTP_PORT,
    SMTP_SECURE,
    EMAIL_FROM,
    DISPATCH_INTERVAL_MS,
    RETENTION_DAYS,
    CALENDAR_SERVICE_URL,
    EVENT_SERVICE_URL,
    SMTP_HOST,
    SMTP_USER,
    SMTP_PASS
}