const calendarsRouter = require('express').Router()
const Calendar = require('../models/calendar')

calendarsRouter.get('/', async (request, response) => {
  const calendars = await Calendar.find({})
  response.json(calendars)
})

calendarsRouter.post('/', async (request, response) => {
  const calendar = new Calendar(request.body)
  const result = await calendar.save()
  response.status(201).json(result)
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
  const result = await Calendar.findByIdAndDelete(request.params.id)
  if (result) {
    response.status(204).end()
  } else {
    response.status(404).json({ error: 'Calendar not found' })
  }
})



module.exports = calendarsRouter