require('dotenv').config()

const asInt = (value, fallback) => {
    const n = Number.parseInt(String(value ?? ''), 10)
    return Number.isFinite(n) ? n : fallback
}

const asBool = (value, fallback = false) => {
    if (value === undefined || value === null) return fallback
    const v = String(value).trim().toLowerCase()
    if (['1', 'true', 'yes', 'y', 'on'].includes(v)) return true
    if (['0', 'false', 'no', 'n', 'off'].includes(v)) return false
    return fallback
}

const PORT = asInt(process.env.PORT, 3004)
const MONGODB_URI = process.env.MONGODB_URI

const SMTP_PORT = asInt(process.env.SMTP_PORT, 465)
const SMTP_SECURE = asBool(process.env.SMTP_SECURE, SMTP_PORT === 465)
const EMAIL_FROM = process.env.EMAIL_FROM

// Nodemailer timeouts (ms). Render/network hiccups can otherwise hang for a long time.
const SMTP_CONNECTION_TIMEOUT_MS = asInt(process.env.SMTP_CONNECTION_TIMEOUT_MS, 10000)
const SMTP_GREETING_TIMEOUT_MS = asInt(process.env.SMTP_GREETING_TIMEOUT_MS, 10000)
const SMTP_SOCKET_TIMEOUT_MS = asInt(process.env.SMTP_SOCKET_TIMEOUT_MS, 15000)

const DISPATCH_INTERVAL_MS = asInt(process.env.DISPATCH_INTERVAL_MS, 15000)
const RETENTION_DAYS = asInt(process.env.RETENTION_DAYS, 90)

const MAX_EMAIL_ATTEMPTS = asInt(process.env.MAX_EMAIL_ATTEMPTS, 3)
const EMAIL_BACKOFF_BASE_MS = asInt(process.env.EMAIL_BACKOFF_BASE_MS, 30000)
const EMAIL_BACKOFF_MAX_MS = asInt(process.env.EMAIL_BACKOFF_MAX_MS, 15 * 60 * 1000)

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
    SMTP_CONNECTION_TIMEOUT_MS,
    SMTP_GREETING_TIMEOUT_MS,
    SMTP_SOCKET_TIMEOUT_MS,
    DISPATCH_INTERVAL_MS,
    RETENTION_DAYS,
    MAX_EMAIL_ATTEMPTS,
    EMAIL_BACKOFF_BASE_MS,
    EMAIL_BACKOFF_MAX_MS,
    CALENDAR_SERVICE_URL,
    EVENT_SERVICE_URL,
    SMTP_HOST,
    SMTP_USER,
    SMTP_PASS
}