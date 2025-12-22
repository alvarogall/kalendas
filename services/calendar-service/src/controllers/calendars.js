const calendarsRouter = require('express').Router()
const Calendar = require('../models/calendar')
const fetch = require('node-fetch')
const config = require('../utils/config')
const ical = require('node-ical')
const axios = require('axios')

calendarsRouter.post('/import', async (request, response) => {
  const { url, provider } = request.body
  
  if (!request.user) return response.status(401).json({ error: 'Autenticación requerida' })

  try {
    if (!url || !String(url).trim()) {
      return response.status(400).json({ error: 'url es requerida' })
    }
    if (!config.EVENT_SERVICE_URL) {
      return response.status(500).json({ error: 'Service misconfigured', detail: 'EVENT_SERVICE_URL not set' })
    }

    // Permite importar solo desde URLs válidas
    let parsedUrl
    try {
      parsedUrl = new URL(String(url).trim())
    } catch (_err) {
      return response.status(400).json({ error: 'url inválida' })
    }
    if (!/^https?:$/.test(parsedUrl.protocol)) {
      return response.status(400).json({ error: 'url inválida' })
    }

    const webRes = await axios.get(url)
    const data = ical.sync.parseICS(webRes.data)
    
    const calendar = new Calendar({
      title: `Importado (${provider || 'Web'})`,
      organizer: request.user.email,
      organizerEmail: request.user.email,
      description: `Importado desde ${url}`,
      startDate: new Date(),
      keywords: ['importado'],
      sourceUrl: url,
      lastSyncedAt: new Date()
    })
    const savedCalendar = await calendar.save()

    // Extrae eventos y los crea en event-service.
    // Límite defensivo para evitar imports enormes.
    const authHeader = request.get('authorization')
    const extracted = []
    for (const k in data) {
      const it = data[k]
      if (!it || it.type !== 'VEVENT') continue
      extracted.push(it)
    }

    const eventsFound = extracted.length
    const maxEvents = 300
    const slice = extracted.slice(0, maxEvents)

    const mapEvent = (it) => {
      const start = it.start ? new Date(it.start) : null
      if (!start || isNaN(start)) return null
      let end = it.end ? new Date(it.end) : null
      if (!end || isNaN(end)) end = new Date(start.getTime() + 60 * 60 * 1000)
      return {
        title: String(it.summary || 'Evento importado'),
        description: it.description ? String(it.description) : '',
        location: it.location ? String(it.location) : 'Importado',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        calendar: String(savedCalendar._id)
      }
    }

    const payloads = slice.map(mapEvent).filter(Boolean)

    const createOne = async (payload) => {
      const res = await fetch(`${config.EVENT_SERVICE_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {})
        },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`event-service error (${res.status}): ${txt}`)
      }
      return res.json()
    }

    // Ejecuta en batches para no saturar el servicio
    const batchSize = 10
    let createdCount = 0
      let failedCount = 0
      const sampleErrors = []
    for (let i = 0; i < payloads.length; i += batchSize) {
      // eslint-disable-next-line no-await-in-loop
      const batch = payloads.slice(i, i + batchSize)
      const results = await Promise.allSettled(batch.map(createOne))
      createdCount += results.filter(r => r.status === 'fulfilled').length

        const rejected = results.filter(r => r.status === 'rejected')
        failedCount += rejected.length
        for (const r of rejected) {
          if (sampleErrors.length >= 3) break
          const msg = String(r.reason?.message || r.reason || 'unknown error')
          sampleErrors.push(msg)
        }
    }

    response.status(201).json({
      message: 'Calendario importado.',
      calendar: savedCalendar,
      eventsFound,
      eventsCreated: createdCount,
        eventsFailed: failedCount,
        sampleErrors,
      eventsTruncated: eventsFound > maxEvents
    })
  } catch (error) {
    response.status(500).json({ error: 'Error importando: ' + error.message })
  }
})

calendarsRouter.post('/:id/sync', async (request, response) => {
  if (!request.user) return response.status(401).json({ error: 'Autenticación requerida' })

  try {
    const calendar = await Calendar.findById(request.params.id)
    if (!calendar) return response.status(404).json({ error: 'Calendario no encontrado' })

    if (!calendar.sourceUrl) {
      return response.status(400).json({ error: 'Este calendario no es importado (no tiene URL fuente)' })
    }

    const norm = (v) => String(v || '').trim().toLowerCase()
    const me = norm(request.user.email)
    const calEmail = norm(calendar.organizerEmail)
    const calOrganizer = norm(calendar.organizer)
    const isOwner = Boolean(me) && ((calEmail && calEmail === me) || (!calEmail && calOrganizer && calOrganizer === me))
    const isAdmin = Boolean(request.user.isAdmin)
    if (!isOwner && !isAdmin) {
      return response.status(403).json({ error: 'No tienes permiso para sincronizar este calendario' })
    }

    // 1. Fetch ICS
    const webRes = await axios.get(calendar.sourceUrl)
    const data = ical.sync.parseICS(webRes.data)

    // 2. Delete existing events
    const authHeader = request.get('authorization')
    const delRes = await fetch(`${config.EVENT_SERVICE_URL}/api/events?calendarId=${calendar._id}`, {
      method: 'DELETE',
      headers: { ...(authHeader ? { Authorization: authHeader } : {}) }
    })
    if (!delRes.ok) {
      throw new Error('Error limpiando eventos antiguos')
    }

    // 3. Create new events
    const extracted = []
    for (const k in data) {
      const it = data[k]
      if (!it || it.type !== 'VEVENT') continue
      extracted.push(it)
    }

    const maxEvents = 300
    const slice = extracted.slice(0, maxEvents)

    const mapEvent = (it) => {
      const start = it.start ? new Date(it.start) : null
      if (!start || isNaN(start)) return null
      let end = it.end ? new Date(it.end) : null
      if (!end || isNaN(end)) end = new Date(start.getTime() + 60 * 60 * 1000)
      return {
        title: String(it.summary || 'Evento importado'),
        description: it.description ? String(it.description) : '',
        location: it.location ? String(it.location) : 'Importado',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        calendar: String(calendar._id)
      }
    }

    const payloads = slice.map(mapEvent).filter(Boolean)

    const createOne = async (payload) => {
      const res = await fetch(`${config.EVENT_SERVICE_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {})
        },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`event-service error (${res.status}): ${txt}`)
      }
      return res.json()
    }

    const batchSize = 10
    let createdCount = 0
      let failedCount = 0
      const sampleErrors = []
    for (let i = 0; i < payloads.length; i += batchSize) {
      const batch = payloads.slice(i, i + batchSize)
      const results = await Promise.allSettled(batch.map(createOne))
      createdCount += results.filter(r => r.status === 'fulfilled').length

        const rejected = results.filter(r => r.status === 'rejected')
        failedCount += rejected.length
        for (const r of rejected) {
          if (sampleErrors.length >= 3) break
          const msg = String(r.reason?.message || r.reason || 'unknown error')
          sampleErrors.push(msg)
        }
    }

    // 4. Update timestamp
    calendar.lastSyncedAt = new Date()
    await calendar.save()

    response.json({
      message: 'Sincronización completada',
      eventsCreated: createdCount,
        eventsFailed: failedCount,
        sampleErrors,
      lastSyncedAt: calendar.lastSyncedAt
    })

  } catch (error) {
    response.status(500).json({ error: 'Error sincronizando: ' + error.message })
  }
})

calendarsRouter.get('/', async (request, response) => {
  const { title, organizer, startDate, endDate, hasEventsByOrganizer, commentedBy, includeAll } = request.query
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

  // Backwards compatible: by default we returned only root calendars.
  // For the UI use-case (selecting any subcalendar as parent), allow fetching all calendars.
  if (String(includeAll) !== 'true') {
    filter.parentId = null
  }

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
  const calendar = await Calendar.findById(request.params.id)
  if (!calendar) return response.status(404).json({ error: 'Calendar not found' })

  // Check ownership or admin
  const user = request.user
  if (!user) return response.status(401).json({ error: 'Autenticación requerida' })
  
  const norm = (v) => String(v || '').trim().toLowerCase()
  const me = norm(user.email)
  const calEmail = norm(calendar.organizerEmail)
  const calOrganizer = norm(calendar.organizer)
  const isOwner = Boolean(me) && ((calEmail && calEmail === me) || (!calEmail && calOrganizer && calOrganizer === me))
  const isAdmin = Boolean(user.isAdmin)

  if (!isOwner && !isAdmin) {
    return response.status(403).json({ error: 'No tienes permiso para editar este calendario' })
  }

  const updated = await Calendar.findByIdAndUpdate(
    request.params.id,
    request.body,
    { new: true, runValidators: true, context: 'query' }
  )

  response.json(updated)
})

calendarsRouter.delete('/:id', async (request, response) => {
  const calendarId = request.params.id
  const calendar = await Calendar.findById(calendarId)
  if (!calendar) return response.status(404).json({ error: 'Calendar not found' })

  // Check ownership or admin
  const user = request.user
  if (!user) return response.status(401).json({ error: 'Autenticación requerida' })
  
  const norm = (v) => String(v || '').trim().toLowerCase()
  const me = norm(user.email)
  const calEmail = norm(calendar.organizerEmail)
  const calOrganizer = norm(calendar.organizer)
  const isOwner = Boolean(me) && ((calEmail && calEmail === me) || (!calEmail && calOrganizer && calOrganizer === me))
  const isAdmin = Boolean(user.isAdmin)

  if (!isOwner && !isAdmin) {
    return response.status(403).json({ error: 'No tienes permiso para eliminar este calendario' })
  }

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