const Notification = require('../models/notification')
const { sendEmail } = require('../services/emailSender')
const config = require('../utils/config')
const logger = require('../utils/logger')

let timer

const computeBackoffMs = (attemptsSoFar) => {
    const exp = Math.max(0, Number(attemptsSoFar) || 0)
    const raw = config.EMAIL_BACKOFF_BASE_MS * Math.pow(2, exp)
    return Math.min(raw, config.EMAIL_BACKOFF_MAX_MS)
}

const cycle = async () => {
    const now = new Date()
    const maxAttempts = config.MAX_EMAIL_ATTEMPTS

    const dueNotifications = await Notification.find({
        channel: 'email',
        nextAttemptAt: { $lte: now },
        $or: [
            { status: 'pending', attempts: { $lt: maxAttempts } },
            { status: 'error', attempts: { $lt: maxAttempts } }
        ]
    })
        .sort({ nextAttemptAt: 1, updatedAt: 1 })
        .limit(25)

    if (dueNotifications.length === 0) {
        logger.info('Dispatcher: no hay notificaciones email para procesar en este ciclo')
        return
    }

    logger.info(`Dispatcher: procesando ${dueNotifications.length} notificaciones email`)

    for (const notification of dueNotifications) {
        try {
            notification.lastAttemptAt = now
            await sendEmail({
                to: notification.recipientEmail,
                subject: 'Notificación de comentario en evento',
                text: notification.message
            })

            notification.status = 'sent'
            notification.processedAt = new Date()
            notification.attempts += 1
            await notification.save()
        } catch (error) {
            const nextAttempts = notification.attempts + 1
            notification.attempts = nextAttempts

            const message = error && error.message ? error.message : String(error)
            notification.lastError = message

            // If we still have attempts left, keep it pending with backoff.
            if (nextAttempts < maxAttempts) {
                notification.status = 'pending'
                const backoffMs = computeBackoffMs(nextAttempts - 1)
                notification.nextAttemptAt = new Date(Date.now() + backoffMs)
            } else {
                // Out of retries: mark as error and stop.
                notification.status = 'error'
                notification.nextAttemptAt = undefined
            }

            await notification.save()
            logger.error(`Error enviando email (attempt ${nextAttempts}/${maxAttempts}):`, message)
        }
    }
}

const start = () => {
    if (timer) {
        return
    }

    logger.info('Iniciando dispatcher de notificaciones email')
    cycle().catch((err) => logger.error('Error en ciclo inicial de dispatcher:', err.message))
    timer = setInterval(() => {
        cycle().catch((err) => logger.error('Error en ciclo de dispatcher:', err.message))
    }, config.DISPATCH_INTERVAL_MS)
}

const stop = () => {
    if (timer) {
        clearInterval(timer)
        timer = undefined
    }
}

module.exports = {
    start,
    stop
}