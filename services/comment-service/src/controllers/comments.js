const  commentsRouter = require('express').Router()
const Comment = require('../models/comment')

commentsRouter.get('/', async (request, response) => {
    const comments = await Comment.find({})
    response.json(comments)
})

commentsRouter.post('/', async (request, response) => {
    const comment = new Comment(request.body)
    const result = await comment.save()
    response.status(201).json(result);
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
    const result = await Comment.findByIdAndDelete(request.params.id)
    if (result) {
        response.status(204).end()
    } else {
        response.status(404).json({ error: 'Comment not found' })
    }
})

// Buscar comentario por id
commentsRouter.get('/:id', async (request, response) => {
    const comment = await Comment.findById(request.params.id)
    if (comment) {
      response.json(comment)
    } else {
      response.status(404).json({ error: 'Comment not found' })
    }
})

// Buscar comentarios por usuario
commentsRouter.get('/user/:user', async (request, response) => {
    const comments = await Comment.find({ user: request.params.user })
    response.json(comments)
})

// Buscar comentarios de un evento
commentsRouter.get('/event/:eventId', async (request, response) => {
    const comments = await Comment.find({ eventId: request.params.eventId })
    response.json(comments)
})

module.exports = commentsRouter