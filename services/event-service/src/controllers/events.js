const eventsRouter = require('express').Router()
const Event = require('../models/event')
const fetch = require('node-fetch')
const config = require('../utils/config')

eventsRouter.get('/', async (request, response) => {
  const { description, organizer, calendarId, calendar, startAfter, startBefore, ids, commentedBy } = request.query
  const filter = {}
  let restrictIds = null

  if (ids && ids.trim()) {
    const raw = ids.split(',').map(s => s.trim()).filter(Boolean)
    const valid = raw.filter(v => /^[0-9a-fA-F]{24}$/.test(v))
    if (valid.length > 0) {
      filter._id = { $in: valid }
    } else {
      return response.json([])
    }
  }

  if (description && description.trim()) {
    const safe = description.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 200)
    const regex = new RegExp(safe, 'i')
    filter.$or = [{ description: regex }, { title: regex }]
  }
  if (organizer && organizer.trim()) {
    filter.organizer = organizer.trim()
  }
  const cal = calendarId || calendar
  if (cal && cal.trim()) {
    filter.calendar = cal.trim()
  }
  if (commentedBy && commentedBy.trim()) {
    try {
      const cres = await fetch(`${config.COMMENT_SERVICE_URL}/api/comments?user=${encodeURIComponent(commentedBy.trim())}`)
      if (!cres.ok) return response.status(502).json({ error: 'upstream comment-service error' })
      const comments = await cres.json()
      const idsSet = new Set(comments.map(c => c.eventId).filter(Boolean))
      restrictIds = idsSet
    } catch (err) {
      return response.status(500).json({ error: 'internal error', detail: err.message })
    }
  }
  if (startAfter || startBefore) {
    filter.startTime = {}
    if (startAfter) {
      const d = new Date(startAfter)
      if (!isNaN(d)) filter.startTime.$gte = d
    }
    if (startBefore) {
      const d = new Date(startBefore)
      if (!isNaN(d)) filter.startTime.$lte = d
    }
    if (Object.keys(filter.startTime).length === 0) delete filter.startTime
  }
  if (restrictIds) {
    const restrictArr = Array.from(restrictIds)
    if (filter._id && filter._id.$in) {
      const current = new Set(filter._id.$in)
      const intersect = restrictArr.filter(id => current.has(id))
      if (intersect.length === 0) return response.json([])
      filter._id.$in = intersect
    } else {
      filter._id = { $in: restrictArr }
    }
  }

  const events = await Event.find(filter).sort({ startTime: -1 })
  response.json(events)
})

eventsRouter.post('/', async (request, response) => {
  try {
    if (!request.user || !request.user.email) {
      return response.status(401).json({ error: 'No autenticado' })
    }
    if (!config.CALENDAR_SERVICE_URL) {
      return response.status(500).json({ error: 'Service misconfigured', detail: 'CALENDAR_SERVICE_URL not set' })
    }

    const calendarId = (() => {
      const raw = request.body?.calendar
      if (raw && typeof raw === 'object' && raw.id) return String(raw.id)
      if (raw != null) return String(raw)
      return ''
    })()

    if (!calendarId || !/^[0-9a-fA-F]{24}$/.test(calendarId)) {
      return response.status(400).json({ error: 'calendar inválido' })
    }

    let calendar
    try {
      const cres = await fetch(`${config.CALENDAR_SERVICE_URL}/api/calendars/${encodeURIComponent(calendarId)}`)
      if (cres.status === 404) return response.status(404).json({ error: 'Calendar not found' })
      if (!cres.ok) return response.status(502).json({ error: 'upstream calendar-service error' })
      calendar = await cres.json()
    } catch (err) {
      return response.status(502).json({ error: 'upstream calendar-service error', detail: err.message })
    }

    const owner = String(calendar?.organizerEmail || calendar?.organizer || '')
    const me = String(request.user.email)
    const isAdmin = Boolean(request.user.isAdmin)

    if ((!owner || owner !== me) && !isAdmin) {
      return response.status(403).json({ error: 'No puedes crear eventos en calendarios que no son tuyos' })
    }

    // Evita spoofing del organizer desde el cliente
    const eventPayload = { ...request.body, organizer: me, calendar: calendarId }

    const event = new Event(eventPayload)
    const result = await event.save()
    response.status(201).json(result)
  } catch (error) {
    console.error('Error creando evento:', error.message)
    // Devolvemos 400 Bad Request con el mensaje de validación
    response.status(400).json({ error: error.message })
  }
})

eventsRouter.get('/:id', async (request, response) => {
  const event = await Event.findById(request.params.id)
  if (event) {
    response.json(event)
  } else {
    response.status(404).json({ error: 'Event not found' })
  }
})

eventsRouter.put('/:id', async (request, response) => {
  const event = await Event.findById(request.params.id)
  if (!event) return response.status(404).json({ error: 'Event not found' })

  // Check ownership or admin
  const user = request.user
  if (!user) return response.status(401).json({ error: 'Autenticación requerida' })
  
  const isOwner = String(event.organizer) === String(user.email)
  const isAdmin = Boolean(user.isAdmin)

  if (!isOwner && !isAdmin) {
    return response.status(403).json({ error: 'No tienes permiso para editar este evento' })
  }

  const result = await Event.findByIdAndUpdate(
    request.params.id,
    request.body,
    { new: true, runValidators: true, context: 'query' }
  )
  response.json(result)
})

eventsRouter.delete('/:id', async (request, response) => {
  const event = await Event.findById(request.params.id)
  if (!event) return response.status(404).json({ error: 'Event not found' })

  // Check ownership or admin
  const user = request.user
  if (!user) return response.status(401).json({ error: 'Autenticación requerida' })
  
  const isOwner = String(event.organizer) === String(user.email)
  const isAdmin = Boolean(user.isAdmin)

  if (!isOwner && !isAdmin) {
    return response.status(403).json({ error: 'No tienes permiso para eliminar este evento' })
  }

  const result = await Event.findByIdAndDelete(request.params.id)
  response.status(204).end()
})

eventsRouter.delete('/', async (request, response) => {
  const { calendarId } = request.query
  if (!calendarId) {
    return response.status(400).json({ error: 'calendarId is required' })
  }
  try {
    await Event.deleteMany({ calendar: calendarId })
    response.status(204).end()
  } catch (error) {
    response.status(500).json({ error: 'internal error', detail: error.message })
  }
})

// Get comments that belong to a specific event
// If COMMENT_SERVICE_URL is not configured, returns 502
eventsRouter.get('/:id/comments', async (request, response) => {
  const eventId = request.params.id
  const event = await Event.findById(eventId)
  if (!event) {
    return response.status(404).json({ error: 'Event not found' })
  }
  if (!config.COMMENT_SERVICE_URL) {
    return response.status(502).json({ error: 'comment service not configured' })
  }
  try {
    const cres = await fetch(`${config.COMMENT_SERVICE_URL}/api/comments?eventId=${encodeURIComponent(eventId)}`)
    if (!cres.ok) return response.status(502).json({ error: 'upstream comment-service error' })
    const comments = await cres.json()
    return response.json(comments)
  } catch (err) {
    return response.status(500).json({ error: 'internal error', detail: err.message })
  }
})

// Get the calendar to which a specific event belongs
// If CALENDAR_SERVICE_URL is configured, this will fetch the calendar details from that service.
// Otherwise it will return the calendar id stored on the event document.
eventsRouter.get('/:id/calendar', async (request, response) => {
  const eventId = request.params.id
  const event = await Event.findById(eventId)
  if (!event) {
    return response.status(404).json({ error: 'Event not found' })
  }
  const calendarId = event.calendar
  if (!calendarId) {
    return response.status(404).json({ error: 'Event has no calendar' })
  }
  if (!config.CALENDAR_SERVICE_URL) {
    // Return only the id when no calendar service is configured
    return response.json({ calendarId })
  }
  try {
    const cres = await fetch(`${config.CALENDAR_SERVICE_URL}/api/calendars/${encodeURIComponent(calendarId)}`)
    if (!cres.ok) return response.status(502).json({ error: 'upstream calendar-service error' })
    const calendar = await cres.json()
    return response.json(calendar)
  } catch (err) {
    return response.status(500).json({ error: 'internal error', detail: err.message })
  }
})

module.exports = eventsRouter