const notificationsRouter = require('express').Router()

const Notification = require('../models/notification')
const fetch = require('node-fetch')
const config = require('../utils/config')

const requireFields = (obj, fields) => {
    for (const field of fields) {
        if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
            return `El campo '${field}' es obligatorio.`
        }
    }
    return null
}

const buildMessage = (commenterName, eventName, calendarTitle) =>
    `${commenterName} ha comentado en "${eventName}" del calendario "${calendarTitle}"`

notificationsRouter.post('/', async (req, res) => {
    const { eventId, calendarId, commenterName } = req.body
    const missing = requireFields(req.body, ['eventId', 'calendarId', 'commenterName'])
    if (missing) {
        return res.status(400).json({ error: missing })
    }

    let event, calendar
    try {
        const eventRes = await fetch(`${config.EVENT_SERVICE_URL}/api/events/${eventId}`)
        if (!eventRes.ok) throw new Error('Evento no encontrado')
        event = await eventRes.json()
    } catch (err) {
        return res.status(400).json({ error: 'Evento no encontrado o error de red' })
    }

    try {
        const calendarRes = await fetch(`${config.CALENDAR_SERVICE_URL}/api/calendars/${calendarId}`)
        if (!calendarRes.ok) throw new Error('Calendario no encontrado')
        calendar = await calendarRes.json()
    } catch (err) {
        return res.status(400).json({ error: 'Calendario no encontrado o error de red' })
    }

    const channel = calendar.notificationChannel || 'email'
    const recipientEmail = calendar.authorEmail
    const eventName = event.title
    const calendarTitle = calendar.title
    const message = buildMessage(commenterName, eventName, calendarTitle)

    const notification = new Notification({
        eventId,
        calendarId,
        channel,
        recipientEmail,
        message,
        read: channel === 'in-app' ? false : undefined,
        status: channel === 'email' ? 'pending' : undefined
    })

    await notification.save()

    res.status(201).json(notification)
})

notificationsRouter.get('/in-app/:recipientEmail', async (req, res) => {
    const notifications = await Notification.find({
        recipientEmail: req.params.recipientEmail,
        channel: 'in-app',
        read: false
    }).sort({ createdAt: -1 })

    res.json(notifications)
})

notificationsRouter.patch('/:id/read', async (req, res) => {
    const notification = await Notification.findByIdAndUpdate(
        req.params.id,
        { read: true },
        { new: true }
    )
    if (!notification) return res.status(404).json({ error: 'notification not found' })
    res.json(notification)
})

module.exports = notificationsRouter