import React, { useState } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import es from 'date-fns/locale/es'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Card, CardMedia } from '@mui/material'
import Map from './Map'
import Comments from './Comments'
import CommentForm from './CommentForm'
import CustomToolbar from './CustomToolbar'

const locales = {
  'es': es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

const messages = {
  allDay: 'Todo el día',
  previous: 'Anterior',
  next: 'Siguiente',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'No hay eventos en este rango',
  showMore: total => `+ Ver más (${total})`
}

const EventComponent = ({ event }) => {
  return (
    <Box sx={{ fontSize: '0.85rem' }}>
      <strong>{format(event.start, 'HH:mm')}</strong> {event.title}
    </Box>
  )
}

const CalendarView = ({ events, onRemoveEvent, comments, onAddComment, onRemoveComment, onFetchComments }) => {
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [newCommentText, setNewCommentText] = useState('')
  const [newCommentUser, setNewCommentUser] = useState('')
  const [isCommentFormOpen, setIsCommentFormOpen] = useState(false)

  const handleSelectEvent = (event) => {
    setSelectedEvent(event)
    onFetchComments(event.id)
  }

  const handleCloseDialog = () => {
    setSelectedEvent(null)
    setNewCommentText('')
    setNewCommentUser('')
    setIsCommentFormOpen(false)
  }

  const handleDelete = () => {
    onRemoveEvent(selectedEvent.id, selectedEvent.title)()
    handleCloseDialog()
  }

  const handleAddCommentSubmit = (e) => {
    e.preventDefault()
    onAddComment({
      text: newCommentText,
      user: newCommentUser,
      eventId: selectedEvent.id
    })
    setNewCommentText('')
    setNewCommentUser('')
    setIsCommentFormOpen(false)
  }

  // Map events to react-big-calendar format
  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: new Date(event.startTime),
    end: new Date(event.endTime),
    allDay: false,
    resource: event
  }))

  return (
    <Box sx={{ height: '85vh', p: 0 }}>
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onSelectEvent={handleSelectEvent}
        views={['month', 'week', 'day', 'agenda']}
        defaultView='month'
        culture='es'
        messages={messages}
        popup={true}
        components={{
          event: EventComponent,
          toolbar: CustomToolbar
        }}
        eventPropGetter={(event) => {
          // Use a single color as requested ("pon solo un color")
          const color = '#1976d2'; 
          return {
            style: {
              backgroundColor: color,
              borderRadius: '4px',
              opacity: 0.8,
              color: 'white',
              border: '0px',
              display: 'block'
            }
          };
        }}
      />

      <Dialog open={!!selectedEvent} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedEvent && (
          <>
            <DialogTitle>{selectedEvent.title}</DialogTitle>
            <DialogContent>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                {format(selectedEvent.start, 'PPpp', { locale: es })} - {format(selectedEvent.end, 'PPpp', { locale: es })}
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedEvent.resource.description}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Ubicación: {selectedEvent.resource.location}
              </Typography>

              {selectedEvent.resource.images && selectedEvent.resource.images.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', mb: 2 }}>
                  {selectedEvent.resource.images.map((img, index) => (
                    <Card key={index} sx={{ minWidth: 200 }}>
                      <CardMedia
                        component="img"
                        height="140"
                        image={img}
                        alt={`Event image ${index + 1}`}
                      />
                    </Card>
                  ))}
                </Box>
              )}

              <Box sx={{ mt: 2, mb: 2 }}>
                <Map location={selectedEvent.resource.location} />
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6">Comentarios</Typography>
                <Comments
                  comments={comments}
                  onRemoveComment={onRemoveComment}
                />
                <Button variant="outlined" onClick={() => setIsCommentFormOpen(true)} sx={{ mt: 1 }}>
                  Añadir Comentario
                </Button>
              </Box>

              {isCommentFormOpen && (
                 <Box sx={{ mt: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                    <CommentForm
                      onSubmit={handleAddCommentSubmit}
                      text={newCommentText}
                      onTextChange={({ target }) => setNewCommentText(target.value)}
                      user={newCommentUser}
                      onUserChange={({ target }) => setNewCommentUser(target.value)}
                    />
                    <Button onClick={() => setIsCommentFormOpen(false)} sx={{ mt: 1 }}>Cancelar</Button>
                 </Box>
              )}

            </DialogContent>
            <DialogActions>
              <Button color="error" onClick={handleDelete}>
                Eliminar Evento
              </Button>
              <Button onClick={handleCloseDialog}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}

export default CalendarView
