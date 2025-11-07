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

calendarsRouter.get('/:id', async (request, response) => {
  const calendar = await Calendar.findById(request.params.id)
  if (calendar) {
    response.json(calendar)
  } else {
    response.status(404).json({ error: 'Calendar not found' })
  }
})

calendarsRouter.get('/search/by-author', async (request, response) => {
  const { author } = request.query;
  
  if (!author) {
    return response.status(400).json({ error: 'Author parameter is required' });
  }
  
  const calendars = await Calendar.find({ 
    author: { $regex: author, $options: 'i' } // búsqueda case-insensitive
  }).sort({ startDate: -1 });
  
  response.json(calendars);
})

calendarsRouter.get('/search/by-date-range', async (request, response) => {
  const { startDate, endDate } = request.query;
  
  if (!startDate || !endDate) {
    return response.status(400).json({ 
      error: 'Both startDate and endDate parameters are required' 
    });
  }

  const calendars = await Calendar.find({
    startDate: { 
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ startDate: -1 });
  
  response.json(calendars);
})

calendarsRouter.get('/search/by-title', async (request, response) => {
  const { title } = request.query;
  
  if (!title) {
    return response.status(400).json({ error: 'Title parameter is required' });
  }
  
  const calendars = await Calendar.find({ 
    title: { $regex: title, $options: 'i' } // búsqueda case-insensitive y parcial
  }).sort({ startDate: -1 });
  
  response.json(calendars);
})

calendarsRouter.get('/:id/subcalendars', async (request, response) => {
  const calendar = await Calendar.findById(request.params.id)
    .populate('sub_calendars');
  
  if (!calendar) {
    return response.status(404).json({ error: 'Calendar not found' });
  }
  response.json(calendar.sub_calendars);
})

calendarsRouter.get('/:id/events', async (request, response) => {
  const calendar = await Calendar.findById(request.params.id);
  
  if (!calendar) {
    return response.status(404).json({ error: 'Calendar not found' });
  }
  
  response.json(calendar.events);
})

module.exports = calendarsRouter