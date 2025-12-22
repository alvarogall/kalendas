const commentsRouter = require('express').Router()
const Comment = require('../models/comment')
const fetch = require('node-fetch')
const config = require('../utils/config')
const logger = require('../utils/logger')

commentsRouter.get('/', async (request, response) => {
    const { eventId, user, organizer, distinctUsers } = request.query

    if (organizer && distinctUsers === 'true') {
        const res = await fetch(`${config.EVENT_SERVICE_URL}/api/events?organizer=${encodeURIComponent(organizer)}`)
        if (!res.ok) return response.status(502).json({ error: 'upstream event-service error' })
        const events = await res.json()
        const ids = events.map(e => e.id).filter(Boolean)
        if (ids.length === 0) return response.json([])
        const users = await Comment.aggregate([
            { $match: { eventId: { $in: ids.map(id => require('mongoose').Types.ObjectId(id)) } } },
            { $group: { _id: '$user' } },
            { $project: { _id: 0, user: '$_id' } }
        ])
        return response.json(users)
    }

    if (organizer) {
        const res = await fetch(`${config.EVENT_SERVICE_URL}/api/events?organizer=${encodeURIComponent(organizer)}`)
        if (!res.ok) return response.status(502).json({ error: 'upstream event-service error' })
        const events = await res.json()
        const ids = events.map(e => e.id).filter(Boolean)
        if (ids.length === 0) return response.json([])
        const comments = await Comment.find({ eventId: { $in: ids } }).sort({ createdAt: -1 })
        return response.json(comments)
    }

    const filter = {}
    if (eventId) filter.eventId = eventId
    if (user) filter.user = user
    const comments = await Comment.find(filter).sort({ createdAt: -1 })
    response.json(comments)
})

commentsRouter.post('/', async (request, response) => {
    const { eventId, user, text } = request.body
    if (!eventId || !user || !text) {
        return response.status(400).json({ error: 'eventId, user y text son obligatorios' })
    }

    const comment = new Comment({ eventId, user, text })
    const saved = await comment.save()

    setImmediate(async () => {
        try {
            const eventRes = await fetch(`${config.EVENT_SERVICE_URL}/api/events/${eventId}`)
            if (!eventRes.ok) throw new Error('Evento no encontrado para notificación')
            const event = await eventRes.json()

            const calendarId = event.calendar
            const commenterName = user

            const notifRes = await fetch(`${config.NOTIFICATION_SERVICE_URL}/api/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId, calendarId, commenterName })
            })

            if (!notifRes.ok) {
                const body = await notifRes.text()
                logger.error('Fallo creando notificación:', notifRes.status, body)
            } else {
                logger.info('Notificación creada para comentario en evento', eventId)
            }
        } catch (err) {
            logger.error('Error al procesar notificación de comentario:', err.message)
        }
    })

    response.status(201).json(saved)
})

commentsRouter.get('/:id', async (request, response) => {
    const comment = await Comment.findById(request.params.id)
    if (comment) {
      response.json(comment)
    } else {
      response.status(404).json({ error: 'Comment not found' })
    }
})

commentsRouter.put('/:id', async (request, response) => {
    const updated = await Comment.findByIdAndUpdate(
        request.params.id,
        request.body,
        { new: true, runValidators: true, context: 'query'}
    )

    if(updated) {
        response.json(updated)
    } else {
        response.status(400).json({ error: 'Comment not found' })
    }
})

commentsRouter.delete('/:id', async (request, response) => {
    response.status(405).json({ error: 'Comment deletion is disabled' })
})

module.exports = commentsRouter