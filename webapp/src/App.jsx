import { useState, useEffect } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import { Box, Button, Fab, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Typography, Avatar, Menu, MenuItem, Tooltip, IconButton } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import theme from './theme'
import Layout from './components/Layout'
import LoginScreen from './components/LoginScreen'
import Calendars from './components/Calendars'
import CalendarForm from './components/CalendarForm'
import ImportIcs from './components/ImportIcs'
import CalendarView from './components/CalendarView'
import EventForm from './components/EventForm'
import Comments from './components/Comments'
import CommentForm from './components/CommentForm'
import NotificationList from './components/NotificationList'
import Filter from './components/Filter'
import AdvancedSearch from './components/AdvancedSearch'
import SettingsDialog from './components/SettingsDialog'
import SettingsIcon from '@mui/icons-material/Settings'
import calendarService from './services/calendars'
import eventService from './services/events'
import dropboxService from './services/dropbox'
import commentService from './services/comments'
import notificationService from './services/notifications'
import uploadService from './services/upload'
import { GoogleLogin, googleLogout } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'

const App = () => {
  const [user, setUser] = useState(null)
  const [anchorElUser, setAnchorElUser] = useState(null)
  const [isImportOpen, setIsImportOpen] = useState(false)

  const [calendars, setCalendars] = useState([])
  const [events, setEvents] = useState([])
  const [comments, setComments] = useState([])
  const [notifications, setNotifications] = useState([])

  const [selectedCalendarIds, setSelectedCalendarIds] = useState([])
  const [inspectedCalendar, setInspectedCalendar] = useState(null)

  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')

  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', onConfirm: () => {} })

  const [eventFilter, setEventFilter] = useState('')

  const [newCalendarTitle, setNewCalendarTitle] = useState('')
  const [newCalendarDesc, setNewCalendarDesc] = useState('')
  const [newCalendarKeywords, setNewCalendarKeywords] = useState('')
  const [newCalendarStart, setNewCalendarStart] = useState('')
  const [newCalendarEnd, setNewCalendarEnd] = useState('')
  const [newCalendarParent, setNewCalendarParent] = useState('')

  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventStart, setNewEventStart] = useState('')
  const [newEventEnd, setNewEventEnd] = useState('')
  const [newEventLocation, setNewEventLocation] = useState('')
  const [newEventDesc, setNewEventDesc] = useState('')
  const [newEventImage, setNewEventImage] = useState(null)
  const [newEventCalendar, setNewEventCalendar] = useState('')
  const [newEventCoordinates, setNewEventCoordinates] = useState(null)
  const [newEventCoordinatesTouched, setNewEventCoordinatesTouched] = useState(false)
  const [newAttachment, setNewAttachment] = useState(null)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [uploadingAttachmentName, setUploadingAttachmentName] = useState('')

  const [editingEvent, setEditingEvent] = useState(null)
  const [eventToOpenId, setEventToOpenId] = useState(null)
  const [imageRemoved, setImageRemoved] = useState(false)

  const [isCalendarFormOpen, setIsCalendarFormOpen] = useState(false)
  const [isEventFormOpen, setIsEventFormOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopOpen, setDesktopOpen] = useState(true)

  // Auth Handlers
  const handleLoginSuccess = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential)
      const isAdmin = decoded.email === 'pruebaparaingweb@gmail.com'
      setUser({ ...decoded, isAdmin })
      notify(`Bienvenido, ${decoded.name}`)
    } catch (err) {
      notify('Error decoding login token', 'error')
    }
  }

  const handleLogout = () => {
    googleLogout()
    setUser(null)
    setAnchorElUser(null)
    notify('Sesión cerrada')
  }

  // Helpers
  const notify = (message, type = 'success') => {
    setSnackbarMessage(message)
    setSnackbarSeverity(type)
    setSnackbarOpen(true)
  }

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }
    setSnackbarOpen(false)
  }

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  const loadCalendars = (filter = '', advanced = {}) => {
    const params = filter ? { title: filter } : {}
    if (advanced.keywords) params.title = advanced.keywords // Or description?
    if (advanced.organizer) params.organizer = advanced.organizer
    if (advanced.startDate) params.startDate = advanced.startDate
    if (advanced.endDate) params.endDate = advanced.endDate

    calendarService.getAll(params).then(initialCalendars => {
      setCalendars(initialCalendars)
      // Removed random color generation as requested ("pon solo un color")
      // We will use a default color in CalendarView or Calendars component
    })
      .catch(error => notify(`Error loading calendars: ${error.message}`, 'error'))
  }

  const loadEvents = (filter = '', advanced = {}) => {
    const params = {}
    if (filter) params.description = filter
    if (advanced.keywords) params.description = advanced.keywords // Search in description/title
    if (advanced.organizer) params.organizer = advanced.organizer
    if (advanced.startDate) params.startAfter = advanced.startDate
    if (advanced.endDate) params.startBefore = advanced.endDate
    
    eventService.getAll(params)
      .then(fetchedEvents => {
        setEvents(fetchedEvents)
      })
      .catch(error => notify(`Error fetching events: ${error.message}`, 'error'))
  }

  const handleAdvancedSearch = (params) => {
    loadCalendars('', params);
    loadEvents(eventFilter, params);
  }

  useEffect(() => {
    loadCalendars()
    loadEvents() // Load all events initially
    notificationService.getAll().then(initialNotifications => setNotifications(initialNotifications))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAddCalendar = (event) => {
    event.preventDefault()
    const channel = (() => {
      try { return localStorage.getItem('notification_preference') || 'email' } catch (e) { return 'email' }
    })()

    const calendarObject = {
      title: newCalendarTitle,
      description: newCalendarDesc,
      organizer: 'CurrentUser',
      organizerEmail: 'user@example.com',
      startDate: newCalendarStart || new Date().toISOString(),
      endDate: newCalendarEnd || null,
      keywords: newCalendarKeywords.split(',').map(k => k.trim()).filter(k => k),
      parentId: newCalendarParent || null,
      notificationChannel: channel
    }

    calendarService.create(calendarObject)
      .then(returnedCalendar => {
        // If a parent calendar was selected, we need to link them
        // if (newCalendarParent) {
        //     const parent = calendars.find(c => c.id === newCalendarParent);
        //     if (parent) {
        //         const updatedParent = {
        //             ...parent,
        //             subCalendars: [...(parent.subCalendars || []), returnedCalendar.id]
        //         };
        //         // We need to update the parent. 
        //         // Note: The backend update usually expects the full object or handles partials.
        //         // Assuming the backend handles the update correctly.
        //         calendarService.update(parent.id, updatedParent)
        //             .then(updatedParentRes => {
        //                 // Update state with both new calendar and updated parent
        //                 setCalendars(calendars.map(c => c.id === parent.id ? updatedParentRes : c).concat(returnedCalendar));
        //                 notify(`Added subcalendar ${returnedCalendar.title} to ${parent.title}`);
        //             })
        //             .catch(err => {
        //                 notify(`Created calendar but failed to link to parent: ${err.message}`, 'warning');
        //                 setCalendars(calendars.concat(returnedCalendar));
        //             });
        //     } else {
        //         setCalendars(calendars.concat(returnedCalendar));
        //         notify(`Added calendar ${returnedCalendar.title}`);
        //     }
        // } else {
        //     setCalendars(calendars.concat(returnedCalendar));
        //     notify(`Added calendar ${returnedCalendar.title}`);
        // }

        loadCalendars(); // Reload calendars to reflect hierarchy

        if (newCalendarParent) {
          const parentName = calendars.find(c => c.id === newCalendarParent)?.title || 'Calendario padre';
          notify(`Added subcalendar ${returnedCalendar.title} to ${parentName}`);
        } else {
          notify(`Added calendar ${returnedCalendar.title}`);
        }

        setNewCalendarTitle('')
        setNewCalendarDesc('')
        setNewCalendarKeywords('')
        setNewCalendarStart('')
        setNewCalendarEnd('')
        setNewCalendarParent('')
        setIsCalendarFormOpen(false) // Close dialog
      })
      .catch(error => notify(error.response?.data?.error || error.message, 'error'))
  }

  const handleImportSuccess = (calendarName) => {
    setIsImportOpen(false)
    loadCalendars()
    loadEvents()
    notify(`Calendario "${calendarName}" importado correctamente`)
  }

  const handleApplySettingsToAll = async () => {
    const preference = localStorage.getItem('notification_preference') || 'email'
    
    // Filtramos para no intentar actualizar calendarios que no sean nuestros
    // (Aunque en esta práctica todos son 'CurrentUser', es buena costumbre)
    const myCalendars = calendars.filter(c => c.organizer === 'CurrentUser' || c.organizer === 'Imported')

    if (myCalendars.length === 0) {
      notify('No tienes calendarios para actualizar', 'info')
      return
    }

    notify(`Actualizando ${myCalendars.length} calendarios a "${preference}"...`, 'info')

    try {
      // Creamos una promesa de actualización por cada calendario
      const updatePromises = myCalendars.map(cal => 
        calendarService.update(cal.id, { ...cal, notificationChannel: preference })
      )

      // Ejecutamos todas a la vez (Parallel)
      await Promise.all(updatePromises)
      
      notify('¡Todos los calendarios actualizados correctamente!')
      loadCalendars() // Recargamos para ver cambios si fuera necesario
    } catch (error) {
      console.error(error)
      notify('Hubo un error al actualizar algunos calendarios', 'error')
    }
  }

  const handleRemoveCalendar = (id, title) => {
    setConfirmDialog({
      open: true,
      title: `¿Eliminar calendario "${title}" y todos sus eventos asociados?`,
      onConfirm: () => {
        calendarService.remove(id)
          .then(() => {
            setCalendars(calendars.filter(c => c.id !== id))
            setSelectedCalendarIds(selectedCalendarIds.filter(cid => cid !== id))
            setEvents(events.filter(e => e.calendar !== id))
            notify(`Deleted ${title}`)
            setConfirmDialog({ ...confirmDialog, open: false })
          })
          .catch(error => notify(error.message, 'error'))
      }
    })
  }

  const handleToggleCalendar = (calendarId) => {
    if (selectedCalendarIds.includes(calendarId)) {
      setSelectedCalendarIds(selectedCalendarIds.filter(id => id !== calendarId))
    } else {
      setSelectedCalendarIds([...selectedCalendarIds, calendarId])
    }
  }

  const handleInspectCalendar = (calendar) => {
    setInspectedCalendar(calendar)
  }

  const handleEventFilterChange = (event) => {
    setEventFilter(event.target.value)
    loadEvents(event.target.value)
  }

  const handleImageChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewEventImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAttachmentChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      setNewAttachment(file)
    }
  }

  const formatDateTimeLocal = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (isNaN(d)) return ''
    const pad = n => n.toString().padStart(2, '0')
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const mi = pad(d.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
  }

  const handleOpenEditEvent = (event) => {
    setEditingEvent(event)
    setNewEventTitle(event.title || '')
    setNewEventStart(formatDateTimeLocal(event.startTime))
    setNewEventEnd(formatDateTimeLocal(event.endTime))
    setNewEventLocation(event.location || '')
    setNewEventDesc(event.description || '')
    setNewEventImage(event.images && event.images.length > 0 ? event.images[0] : null)
    setImageRemoved(false)
    setNewEventCalendar(event.calendar || '')
    setNewEventCoordinates(event.coordinates || null)
    setNewEventCoordinatesTouched(false)
    setIsEventFormOpen(true)
  }

  const openCreateEventForm = () => {
    setEditingEvent(null)
    setNewEventTitle('')
    const now = new Date()
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000)
    setNewEventStart(formatDateTimeLocal(now.toISOString()))
    setNewEventEnd(formatDateTimeLocal(inOneHour.toISOString()))
    setNewEventLocation('')
    setNewEventDesc('')
    setNewEventImage(null)
    setImageRemoved(false)
    const defaultCal = selectedCalendarIds.length > 0 ? selectedCalendarIds[0] : (calendars[0]?.id || '')
    setNewEventCalendar(defaultCal)
    setNewEventCoordinates(null)
    setNewEventCoordinatesTouched(false)
    setIsEventFormOpen(true)
  }

  const handleAddEvent = async (event) => {
    event.preventDefault()

    try {
      let imageUrl = ''
      if (newEventImage) {
        notify('Uploading image...', 'info')
        imageUrl = await uploadService.uploadImage(newEventImage)
      }

      const eventObject = {
        title: newEventTitle,
        startTime: new Date(newEventStart).toISOString(),
        endTime: new Date(newEventEnd).toISOString(),
        location: newEventLocation,
        description: newEventDesc,
        organizer: 'CurrentUser',
        calendar: newEventCalendar || (selectedCalendarIds.length > 0 ? selectedCalendarIds[0] : calendars[0]?.id),
        images: imageUrl ? [imageUrl] : [],
        attachments: []
      }

      // Include coordinates if the user selected them in the map
      if (newEventCoordinates) {
        eventObject.coordinates = newEventCoordinates
      }

      console.log('Creating event payload', eventObject)
      if (!eventObject.calendar) {
        notify('Please create or select a calendar first', 'error')
        return
      }

      // If there's an attachment, upload it to Dropbox first and include URL
      if (newAttachment) {
        setUploadingAttachment(true)
        setUploadingAttachmentName(newAttachment.name)
        try {
          const url = await dropboxService.uploadFile(newAttachment)
          eventObject.attachments = [url]
        } catch (err) {
          notify(`Failed to upload attachment: ${err.message}`, 'error')
          return
        } finally {
          setUploadingAttachment(false)
          setUploadingAttachmentName('')
        }
      }

      // Create event including any uploaded attachment URL
      const returnedEvent = await eventService.create(eventObject)
      setEvents(events.concat(returnedEvent))
      setNewEventTitle('')
      setNewEventStart('')
      setNewEventEnd('')
      setNewEventLocation('')
      setNewEventDesc('')
      setNewEventImage(null)
      setNewEventCalendar('')
      setNewAttachment(null)
      setIsEventFormOpen(false) // Close dialog
      notify(`Added event ${returnedEvent.title}`)
    
    eventService.create(eventObject)
      .then(returnedEvent => {
        setEvents(events.concat(returnedEvent))
        setNewEventTitle('')
        setNewEventStart('')
        setNewEventEnd('')
        setNewEventLocation('')
        setNewEventDesc('')
        setNewEventImage(null)
        setNewEventCalendar('')
        setIsEventFormOpen(false) // Close dialog
        notify(`Added event ${returnedEvent.title}`)
      })
      .catch(error => notify(error.response?.data?.error || error.message, 'error'))
    } catch (err) {
      notify(err.response?.data?.error || err.message, 'error')
    }

  }

  const handleUpdateEvent = (e) => {
    e.preventDefault()
    if (!editingEvent) return
    const updated = {
      title: newEventTitle,
      startTime: new Date(newEventStart).toISOString(),
      endTime: new Date(newEventEnd).toISOString(),
      location: newEventLocation,
      description: newEventDesc,
      organizer: editingEvent.organizer || 'CurrentUser',
      calendar: newEventCalendar || editingEvent.calendar,
      images: newEventImage ? [newEventImage] : (editingEvent.images || [])
    }

    // Ensure coordinates are updated:
    // - if the user interacted with the coordinates control, apply that value (can be null to clear)
    // - otherwise keep the existing coordinates on the event
    if (newEventCoordinatesTouched) {
      // If the user interacted with the coordinates control, include coordinates only when
      // a valid value is present. If they cleared the control (null/undefined) we omit
      // the field here (do not send `coordinates: null`) to avoid backend validation errors.
      if (newEventCoordinates) {
        updated.coordinates = newEventCoordinates
      }
    }

    // decide images according to new image / removal flag
    if (newEventImage) {
      updated.images = [newEventImage]
    } else if (imageRemoved) {
      updated.images = []
    } else {
      updated.images = editingEvent.images || []
    }

    console.log('Updating event payload', updated)
    eventService.update(editingEvent.id, updated)
      .then(returnedEvent => {
        const handleUpdatedEvent = (updatedEvent) => {
          setEvents(events.map(ev => ev.id === updatedEvent.id ? updatedEvent : ev))
          setEditingEvent(null)
          setNewEventTitle('')
          setNewEventStart('')
          setNewEventEnd('')
          setNewEventLocation('')
          setNewEventDesc('')
          setNewEventImage(null)
          setNewEventCalendar('')
          setImageRemoved(false)
          setNewAttachment(null)
          setIsEventFormOpen(false)
          // Ask CalendarView to reopen the updated event so user sees the latest values
          setEventToOpenId(updatedEvent.id)
          notify(`Updated event ${updatedEvent.title}`)
        }

        if (newAttachment) {
          // upload to Dropbox then persist attachment URL in the event
          setUploadingAttachment(true)
          setUploadingAttachmentName(newAttachment.name)
          dropboxService.uploadFile(newAttachment)
            .then(url => {
              const attachments = (returnedEvent.attachments || []).concat([url])
              eventService.update(returnedEvent.id, { attachments })
                .then(updatedEvent => handleUpdatedEvent(updatedEvent))
                .catch(err => {
                  setEvents(events.map(ev => ev.id === returnedEvent.id ? returnedEvent : ev))
                  setEditingEvent(null)
                  setNewAttachment(null)
                  setIsEventFormOpen(false)
                  notify(`Updated event but failed to persist attachment URL: ${err.message}`, 'warning')
                })
            })
            .catch(err => {
              setEvents(events.map(ev => ev.id === returnedEvent.id ? returnedEvent : ev))
              setEditingEvent(null)
              setNewAttachment(null)
              setIsEventFormOpen(false)
              notify(`Updated event but failed to upload attachment: ${err.message}`, 'warning')
            })
            .finally(() => {
              setUploadingAttachment(false)
              setUploadingAttachmentName('')
            })
        } else {
          handleUpdatedEvent(returnedEvent)
        }
      })
      .catch(error => notify(error.response?.data?.error || error.message, 'error'))
  }

  const handleRemoveEvent = (id, title) => () => {
    setConfirmDialog({
      open: true,
      title: `¿Eliminar evento "${title}"?`,
      onConfirm: () => {
        eventService.remove(id)
          .then(() => {
            setEvents(events.filter(e => e.id !== id))
            notify(`Deleted ${title}`)
            setConfirmDialog({ ...confirmDialog, open: false })
          })
          .catch(error => notify(error.message, 'error'))
      }
    })
  }

  const handleFetchComments = (eventId) => {
    commentService.getAll({ eventId })
      .then(fetchedComments => {
        setComments(fetchedComments)
      })
      .catch(error => notify(`Error fetching comments: ${error.message}`, 'error'))
  }

  const handleEventUpdated = (updatedEvent) => {
    setEvents(events.map(ev => ev.id === updatedEvent.id ? updatedEvent : ev))
    // ensure dialog reflects latest data if it's open elsewhere
    setEventToOpenId(updatedEvent.id)
  }

  const handleAddComment = (commentObject) => {
    commentService.create(commentObject)
      .then(returnedComment => {
        setComments(comments.concat(returnedComment))
        notify('Comment added')
        notificationService.getAll().then(n => setNotifications(n))
      })
      .catch(error => notify(error.response?.data?.error || error.message, 'error'))
  }

  const handleRemoveComment = (id) => () => {
    setConfirmDialog({
      open: true,
      title: '¿Eliminar comentario?',
      onConfirm: () => {
        commentService.remove(id)
          .then(() => {
            setComments(comments.filter(c => c.id !== id))
            notify('Comment deleted')
            setConfirmDialog({ ...confirmDialog, open: false })
          })
          .catch(error => notify(error.message, 'error'))
      }
    })
  }

  const handleMarkNotificationRead = (id) => {
    notificationService.markAsRead(id)
      .then(updatedNotification => {
        setNotifications(notifications.map(n => n.id === id ? updatedNotification : n))
      })
  }

  const handleDeleteNotification = (id) => {
    notificationService.remove(id)
      .then(() => {
        setNotifications(notifications.filter(n => n.id !== id))
      })
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
    setDesktopOpen(!desktopOpen)
  }

  const authControl = user ? (
    <Box sx={{ flexGrow: 0, ml: 2 }}>
      <Tooltip title="Open settings">
        <IconButton onClick={(e) => setAnchorElUser(e.currentTarget)} sx={{ p: 0 }}>
          <Avatar alt={user.name} src={user.picture} />
        </IconButton>
      </Tooltip>
      <Menu
        sx={{ mt: '45px' }}
        id="menu-appbar"
        anchorEl={anchorElUser}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        keepMounted
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={Boolean(anchorElUser)}
        onClose={() => setAnchorElUser(null)}
      >
        <MenuItem disabled><Typography textAlign="center">{user.name}</Typography></MenuItem>
        {user.isAdmin && <MenuItem disabled><Typography textAlign="center" color="primary">ADMIN</Typography></MenuItem>}
        <MenuItem onClick={handleLogout}>
          <Typography textAlign="center">Logout</Typography>
        </MenuItem>
      </Menu>
    </Box>
  ) : null

  const sidebarContent = (
    <Box>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          fullWidth 
          onClick={() => setIsCalendarFormOpen(true)}
          sx={{ 
            borderRadius: 24, 
            boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            letterSpacing: '0.25px',
            backgroundColor: '#fff',
            color: '#3c4043',
            '&:hover': { backgroundColor: '#f1f3f4' },
          }}
        >
          Create Calendar
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<FileUploadIcon />} 
          fullWidth 
          onClick={() => setIsImportOpen(true)}
          sx={{ textTransform: 'none' }}
        >
          Import Calendar
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<SettingsIcon />} 
          fullWidth 
          onClick={() => setIsSettingsOpen(true)}
          sx={{ textTransform: 'none' }}
        >
          Configuración
        </Button>
        <AdvancedSearch onSearch={handleAdvancedSearch} />
      </Box>
      <Calendars
        calendars={calendars}
        onRemoveCalendar={handleRemoveCalendar}
        onToggleCalendar={handleToggleCalendar}
        selectedCalendarIds={selectedCalendarIds}
        onInspectCalendar={handleInspectCalendar}
      />
    </Box>
  )

  // Filter events based on selected calendars
  const visibleEvents = selectedCalendarIds.length > 0 
    ? events.filter(event => selectedCalendarIds.includes(String(event.calendar)))
    : events

  return (
    <ThemeProvider theme={theme}>
      {!user ? (
        <LoginScreen 
          onSuccess={handleLoginSuccess} 
          onError={() => notify('Login Failed', 'error')} 
        />
      ) : (
        <Layout
          sidebarContent={sidebarContent}
          notificationCount={notifications.filter(n => !n.read).length}
          onNotificationClick={() => setIsNotificationOpen(true)}
          onMenuClick={handleDrawerToggle}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          desktopOpen={desktopOpen}
          authControl={authControl}
        >
        <Dialog open={isImportOpen} onClose={() => setIsImportOpen(false)}>
          <DialogTitle>Import Calendar</DialogTitle>
          <DialogContent>
            <ImportIcs onImportSuccess={handleImportSuccess} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsImportOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        >
          <DialogTitle>{confirmDialog.title}</DialogTitle>
          <DialogActions>
            <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>Cancelar</Button>
            <Button onClick={confirmDialog.onConfirm} color="error" variant="contained">Eliminar</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>

        {/* Notification Dialog */}
        <Dialog open={isNotificationOpen} onClose={() => setIsNotificationOpen(false)}>
          <DialogTitle>Notifications</DialogTitle>
          <DialogContent>
             <NotificationList
                notifications={notifications}
                onMarkAsRead={handleMarkNotificationRead}
                onDelete={handleDeleteNotification}
              />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsNotificationOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        <SettingsDialog 
            open={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            onApplyToAll={handleApplySettingsToAll}
        />

        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 2 }}>
            <h2>{selectedCalendarIds.length > 0 ? 'Selected Calendars' : 'All Events'}</h2>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Filter label="Search events" value={eventFilter} onChange={handleEventFilterChange} />
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />} 
                  onClick={openCreateEventForm} 
                  sx={{ 
                    ml: 2,
                    borderRadius: 20,
                    textTransform: 'none',
                    boxShadow: 'none',
                    px: 3
                  }}
                >
                  New Event
                </Button>
            </Box>
          </Box>
          
          <CalendarView
            events={visibleEvents}
            onRemoveEvent={handleRemoveEvent}
            comments={comments}
            onAddComment={handleAddComment}
            onRemoveComment={handleRemoveComment}
            onFetchComments={handleFetchComments}
            onEditEvent={handleOpenEditEvent}
            openEventId={eventToOpenId}
            onOpenHandled={() => setEventToOpenId(null)}
            calendars={calendars}
            onEventUpdated={handleEventUpdated}
          />

          <Dialog open={isEventFormOpen} onClose={() => { setIsEventFormOpen(false); setEditingEvent(null); setNewEventCoordinates(null); setNewEventCoordinatesTouched(false); }}>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Create Event'}</DialogTitle>
            <DialogContent>
              <EventForm
                onSubmit={editingEvent ? handleUpdateEvent : handleAddEvent}
                title={newEventTitle}
                onTitleChange={({ target }) => setNewEventTitle(target.value)}
                start={newEventStart}
                onStartChange={({ target }) => setNewEventStart(target.value)}
                end={newEventEnd}
                onEndChange={({ target }) => setNewEventEnd(target.value)}
                location={newEventLocation}
                onLocationChange={({ target }) => setNewEventLocation(target.value)}
                description={newEventDesc}
                onDescriptionChange={({ target }) => setNewEventDesc(target.value)}
                onImageChange={handleImageChange}
                image={newEventImage}
                onRemoveImage={() => { setNewEventImage(null); setImageRemoved(true); }}
                attachment={newAttachment}
                onAttachmentChange={handleAttachmentChange}
                onRemoveAttachment={() => setNewAttachment(null)}
                uploadingAttachment={uploadingAttachment}
                uploadingAttachmentName={uploadingAttachmentName}
                calendars={calendars}
                selectedCalendar={newEventCalendar || (selectedCalendarIds.length > 0 ? selectedCalendarIds[0] : '')}
                onCalendarChange={({ target }) => setNewEventCalendar(target.value)}
                coordinates={newEventCoordinates}
                onCoordinatesChange={(coords) => { setNewEventCoordinates(coords); setNewEventCoordinatesTouched(true); }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => { setIsEventFormOpen(false); setEditingEvent(null); setNewEventCoordinates(null); setNewEventCoordinatesTouched(false); }}>Cancel</Button>
            </DialogActions>
          </Dialog>
        </Box>

        {/* Calendar Creation Dialog */}
        <Dialog open={isCalendarFormOpen} onClose={() => setIsCalendarFormOpen(false)}>
          <DialogTitle>Create Calendar</DialogTitle>
          <DialogContent>
            <ImportIcs onImportSuccess={handleImportSuccess} />
            <CalendarForm
              onSubmit={handleAddCalendar}
              titleValue={newCalendarTitle}
              onTitleChange={({ target }) => setNewCalendarTitle(target.value)}
              descriptionValue={newCalendarDesc}
              onDescriptionChange={({ target }) => setNewCalendarDesc(target.value)}
              keywordsValue={newCalendarKeywords}
              onKeywordsChange={({ target }) => setNewCalendarKeywords(target.value)}
              startDateValue={newCalendarStart}
              onStartDateChange={({ target }) => setNewCalendarStart(target.value)}
              endDateValue={newCalendarEnd}
              onEndDateChange={({ target }) => setNewCalendarEnd(target.value)}
              parentCalendarValue={newCalendarParent}
              onParentCalendarChange={({ target }) => setNewCalendarParent(target.value)}
              availableCalendars={calendars}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsCalendarFormOpen(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>

        {/* Calendar Inspection Dialog */}
        <Dialog open={!!inspectedCalendar} onClose={() => setInspectedCalendar(null)}>
          <DialogTitle>Detalles del Calendario</DialogTitle>
          <DialogContent>
            {inspectedCalendar && (
              <Box sx={{ minWidth: 300 }}>
                <Typography variant="h6" gutterBottom>{inspectedCalendar.title}</Typography>
                <Typography variant="body1" paragraph>{inspectedCalendar.description}</Typography>
                
                <Typography variant="subtitle2" color="text.secondary">Organizador</Typography>
                <Typography variant="body2" gutterBottom>{inspectedCalendar.organizer} ({inspectedCalendar.organizerEmail})</Typography>
                
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Fechas</Typography>
                <Typography variant="body2" gutterBottom>
                  Inicio: {new Date(inspectedCalendar.startDate).toLocaleDateString()}
                  {inspectedCalendar.endDate && ` - Fin: ${new Date(inspectedCalendar.endDate).toLocaleDateString()}`}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Notificaciones</Typography>
                <Typography variant="body2" gutterBottom>{inspectedCalendar.notificationChannel}</Typography>

                {inspectedCalendar.keywords && inspectedCalendar.keywords.length > 0 && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Palabras Clave</Typography>
                    <Typography variant="body2">{inspectedCalendar.keywords.join(', ')}</Typography>
                  </>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setInspectedCalendar(null)}>Cerrar</Button>
          </DialogActions>
        </Dialog>

        </Layout>
      )}
    </ThemeProvider>
  )
}

export default App