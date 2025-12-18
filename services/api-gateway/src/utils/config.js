require('dotenv').config()

const normalizeServiceUrl = (raw) => {
  if (!raw) return undefined
  try {
    const u = new URL(raw)
    // Render services are hosted at the origin; paths like "/api" are a common misconfig.
    return u.origin
  } catch (_err) {
    // If it's not a valid URL (e.g. internal docker hostname), keep as-is.
    return raw
  }
}

const normalizeGoogleClientId = (raw) => {
  if (!raw) return undefined
  const v = String(raw).trim().replace(/^['"]|['"]$/g, '')
  if (v.startsWith('http://') || v.startsWith('https://')) {
    try {
      return new URL(v).hostname
    } catch (_err) {
      return v
    }
  }
  return v
}

const CALENDAR_SERVICE_URL = normalizeServiceUrl(process.env.CALENDAR_SERVICE_URL)
const EVENT_SERVICE_URL = normalizeServiceUrl(process.env.EVENT_SERVICE_URL)
const COMMENT_SERVICE_URL = normalizeServiceUrl(process.env.COMMENT_SERVICE_URL)
const NOTIFICATION_SERVICE_URL = normalizeServiceUrl(process.env.NOTIFICATION_SERVICE_URL)

module.exports = {
  PORT: process.env.PORT || process.env.GATEWAY_PORT || 10000,
  GOOGLE_CLIENT_ID: normalizeGoogleClientId(process.env.GOOGLE_CLIENT_ID),
  CALENDAR_SERVICE_URL,
  EVENT_SERVICE_URL,
  COMMENT_SERVICE_URL,
  NOTIFICATION_SERVICE_URL,
  __raw: {
    CALENDAR_SERVICE_URL: process.env.CALENDAR_SERVICE_URL,
    EVENT_SERVICE_URL: process.env.EVENT_SERVICE_URL,
    COMMENT_SERVICE_URL: process.env.COMMENT_SERVICE_URL,
    NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL
  }
}