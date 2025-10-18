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

module.exports = eventsRouter