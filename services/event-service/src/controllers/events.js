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

eventsRouter.get('/:id', async (request, response) => {
  const event = await Event.findById(request.params.id)
  if (event) {
    response.json(event)
  } else {
    response.status(404).json({ error: 'Event not found' })
  }
})

module.exports = eventsRouter