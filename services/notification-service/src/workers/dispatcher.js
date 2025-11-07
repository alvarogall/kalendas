const Notification = require('../models/notification')
const { sendEmail } = require('../services/emailSender')
const config = require('../utils/config')
const logger = require('../utils/logger')

let timer

const cycle = async () => {
    const dueNotifications = await Notification.find({
        channel: 'email',
        $or: [
            { status: 'pending' },
            { status: 'error', attempts: { $lt: 3 } }
        ]
    }).limit(25)

    if (dueNotifications.length === 0) {
        logger.info('Dispatcher: no hay notificaciones email para procesar en este ciclo')
        return
    }

    logger.info(`Dispatcher: procesando ${dueNotifications.length} notificaciones email`)

    for (const notification of dueNotifications) {
        try {
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
            notification.status = notification.attempts + 1 < 3 ? 'pending' : 'error'
            notification.lastError = error.message
            notification.attempts += 1
            await notification.save()
            logger.error('Error enviando email:', error.message)
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