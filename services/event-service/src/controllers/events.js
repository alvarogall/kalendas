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
  const event = new Event(request.body)
  const result = await event.save()
  response.status(201).json(result)
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
  const result = await Event.findByIdAndUpdate(
    request.params.id,
    request.body,
    { new: true, runValidators: true, context: 'query' }
  )
  if (result) {
    response.json(result)
  } else {
    response.status(404).json({ error: 'Event not found' })
  }
})

eventsRouter.delete('/:id', async (request, response) => {
  const result = await Event.findByIdAndDelete(request.params.id)
  if (result) {
    response.status(204).end()
  } else {
    response.status(404).json({ error: 'Event not found' })
  }
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