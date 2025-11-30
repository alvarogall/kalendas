const calendarsRouter = require('express').Router()
const Calendar = require('../models/calendar')
const fetch = require('node-fetch')
const config = require('../utils/config')

calendarsRouter.get('/', async (request, response) => {
  const { title, organizer, startDate, endDate, hasEventsByOrganizer, commentedBy } = request.query
  const filter = {}
  if (title && title.trim()) {
    filter.title = { $regex: title.trim(), $options: 'i' }
  }
  if (organizer && organizer.trim()) {
    filter.organizer = { $regex: organizer.trim(), $options: 'i' }
  }
  if (startDate || endDate) {
    filter.startDate = {}
    if (startDate) {
      const sd = new Date(startDate)
      if (!isNaN(sd)) filter.startDate.$gte = sd
    }
    if (endDate) {
      const ed = new Date(endDate)
      if (!isNaN(ed)) filter.startDate.$lte = ed
    }
    if (Object.keys(filter.startDate).length === 0) delete filter.startDate
  }

  let restrictIds = null

  if (hasEventsByOrganizer && hasEventsByOrganizer.trim()) {
    try {
      const res = await fetch(`${config.EVENT_SERVICE_URL}/api/events?organizer=${encodeURIComponent(hasEventsByOrganizer.trim())}`)
      if (!res.ok) return response.status(502).json({ error: 'upstream event-service error' })
      const events = await res.json()
      const ids = new Set(events.map(e => e.calendar).filter(Boolean))
      restrictIds = restrictIds ? new Set([...restrictIds].filter(x => ids.has(x))) : ids
    } catch (err) {
      return response.status(500).json({ error: 'internal error', detail: err.message })
    }
  }

  if (commentedBy && commentedBy.trim()) {
    try {
      const cres = await fetch(`${config.COMMENT_SERVICE_URL}/api/comments?user=${encodeURIComponent(commentedBy.trim())}`)
      if (!cres.ok) return response.status(502).json({ error: 'upstream comment-service error' })
      const comments = await cres.json()
      const eventIds = Array.from(new Set(comments.map(c => c.eventId).filter(Boolean)))
      if (eventIds.length === 0) {
        return response.json([])
      }
      const idsCsv = eventIds.slice(0, 200).join(',') // defensive limit
      const eres = await fetch(`${config.EVENT_SERVICE_URL}/api/events?ids=${encodeURIComponent(idsCsv)}`)
      if (!eres.ok) return response.status(502).json({ error: 'upstream event-service error' })
      const evs = await eres.json()
      const ids = new Set(evs.map(e => e.calendar).filter(Boolean))
      restrictIds = restrictIds ? new Set([...restrictIds].filter(x => ids.has(x))) : ids
    } catch (err) {
      return response.status(500).json({ error: 'internal error', detail: err.message })
    }
  }

  if (restrictIds && restrictIds.size === 0) {
    return response.json([])
  }
  if (restrictIds) {
    filter._id = { $in: Array.from(restrictIds) }
  }

  filter.parentId = null

  const calendars = await Calendar.find(filter)
    .populate('subCalendars')
    .sort({ startDate: -1 })

  response.json(calendars)
})

calendarsRouter.post('/', async (request, response) => {
  const { parentId, ...body } = request.body;

  const calendar = new Calendar({
    ...body,
    parentId: parentId || null
  })
  const savedCalendar = await calendar.save()

  if (parentId) {
    await Calendar.findByIdAndUpdate(parentId, {
      $addToSet: { subCalendars: savedCalendar._id }
    })
  }

  response.status(201).json(savedCalendar)
})

calendarsRouter.get('/:id', async (request, response) => {
  const calendar = await Calendar.findById(request.params.id)
  if (calendar) {
    response.json(calendar)
  } else {
    response.status(404).json({ error: 'Calendar not found' })
  }
})

calendarsRouter.put('/:id', async (request, response) => {
  const updated = await Calendar.findByIdAndUpdate(
    request.params.id,
    request.body,
    { new: true, runValidators: true, context: 'query' }
  )

  if (updated) {
    response.json(updated)
  } else {
    response.status(404).json({ error: 'Calendar not found' })
  }
})

calendarsRouter.delete('/:id', async (request, response) => {
  const calendarId = request.params.id

  if (config.EVENT_SERVICE_URL) {
    try {
      const res = await fetch(`${config.EVENT_SERVICE_URL}/api/events?calendarId=${calendarId}`, { method: 'DELETE' })
      if (!res.ok) {
        console.error('Failed to delete events for calendar', calendarId)
      }
    } catch (err) {
      console.error('Error contacting event service', err)
    }
  }

  const result = await Calendar.findByIdAndDelete(calendarId)
  if (result) {
    response.status(204).end()
  } else {
    response.status(404).json({ error: 'Calendar not found' })
  }
})

calendarsRouter.get('/:id/subcalendars', async (request, response) => {
  const calendar = await Calendar.findById(request.params.id)
    .populate('subCalendars');
  
  if (!calendar) {
    return response.status(404).json({ error: 'Calendar not found' });
  }
  response.json(calendar.subCalendars);
})

module.exports = calendarsRouter