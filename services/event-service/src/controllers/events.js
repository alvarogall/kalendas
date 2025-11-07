const eventsRouter = require('express').Router()
const Event = require('../models/event')

eventsRouter.get('/', async (request, response) => {
  const events = await Event.find({})
  response.json(events)
})

eventsRouter.post('/', async (request, response) => {
  const event = new Event(request.body)
  const result = await event.save()
  response.status(201).json(result)
})

eventsRouter.delete('/:id', async (request, response) => {
  const result = await Event.findByIdAndDelete(request.params.id)
  if (result) {
    response.status(204).end()
  } else {
    response.status(404).json({ error: 'Event not found' })
  }
})

eventsRouter.put('/:id', async(request, response) => {

  const result = await Event.findByIdAndUpdate(
    request.params.id,
    request.body,
    { new:true, runValidators:true, context:'query'}
  )

  if(result){
    response.json(result)
  }else{
    response.status(404).json({error: 'Event not found'})
  }
})

// helper: escape user input for RegExp to avoid syntax errors / DoS
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// GET /api/events/search
// Query params:
//  - description: partial match on title OR description (case-insensitive)
//  - organizer: exact match on organizer
//  - calendar: calendar id (ObjectId string)
//  - startAfter, startBefore: ISO date strings to filter by startTime
// Example: /api/events/search?description=planning&organizer=maria&startAfter=2025-01-01
eventsRouter.get('/search', async (request, response) => {
  const { description, organizer, calendar, startAfter, startBefore } = request.query

  const filter = { deleted: false }

  if (description && description.trim().length > 0) {
    // escape user input and build case-insensitive regex
    const safe = escapeRegExp(description.trim()).slice(0, 200) // limit length
    const regex = new RegExp(safe, 'i')
    filter.$or = [{ description: regex }, { title: regex }]
  }

  if (organizer && organizer.trim().length > 0) {
    filter.organizer = organizer.trim()
  }

  if (calendar && calendar.trim().length > 0) {
    filter.calendar = calendar.trim()
  }

  // optional date range filter
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
    // if both invalid, delete the filter
    if (Object.keys(filter.startTime).length === 0) delete filter.startTime
  }

  const events = await Event.find(filter).sort({ startTime: -1 })
  response.json(events)
})

// GET /api/events/by-user/:user
// Returns events where comments.user == :user OR createdBy == :user
// Example: /api/events/by-user/ana@example.com
eventsRouter.get('/by-user/:user', async (request, response) => {
  const user = request.params.user
  if (!user || user.trim().length === 0) {
    return response.status(400).json({ error: 'User parameter is required' })
  }

  const events = await Event.find({
    deleted: false,
    $or: [
      { 'comments.user': user },
      { createdBy: user }
    ]
  }).sort({ startTime: -1 })

  response.json(events)
})

eventsRouter.get('/:id', async (request, response) => {
  const event = await Event.findById(request.params.id)
  if (event) {
    response.json(event)
  } else {
    response.status(404).json({ error: 'Event not found' })
  }
})

module.exports = eventsRouter