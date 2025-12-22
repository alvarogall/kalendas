import { useState, useEffect, useRef } from 'react';
import { Button } from './components/ui/Button';
import { Modal } from './components/ui/Modal';
import { Toast } from './components/ui/Toast';
import Layout from './components/Layout';
import LoginScreen from './components/LoginScreen';
import CalendarView from './components/CalendarView';
import CalendarForm from './components/CalendarForm';
import EventForm from './components/EventForm';
import ImportIcs from './components/ImportIcs';
import SettingsDialog from './components/SettingsDialog';
import NotificationList from './components/NotificationList';
import { Plus, Upload, Settings, LogOut, Pencil, RefreshCw, Info, Trash2 } from 'lucide-react';

// Servicios (Importados tal cual la entrega)
import calendarService from './services/calendars';
import eventService from './services/events';
import notificationService from './services/notifications';
import preferencesService from './services/preferences';
import { apiBaseUrl } from './services/config';
import { googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const App = () => {
  // Estado Lazy para evitar flash en F5 (Mejora UX)
  const [user, setUser] = useState(() => {
    const savedUser = window.localStorage.getItem('kalendasUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Evita un "flash" de la app con un usuario antiguo tras refrescar.
  // Marcamos la sesión como comprobada cuando validamos /token, o cuando no aplica (guest / sin email).
  const [sessionChecked, setSessionChecked] = useState(() => {
    try {
      const raw = window.localStorage.getItem('kalendasUser')
      if (!raw) return true
      const parsed = JSON.parse(raw)
      return Boolean(parsed?.isGuest) || !parsed?.email
    } catch (_e) {
      return true
    }
  })

  const [calendars, setCalendars] = useState([]);
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState([]);

  // Calendarios no propios que el usuario decide añadir a su lista (para poder visualizarlos)
  const [trackedCalendarIds, setTrackedCalendarIds] = useState([])

  const emptyCalendarSearch = {
    title: '',
    keywords: '',
    organizer: '',
    fromDate: '',
    toDate: ''
  }

  const [calendarSearch, setCalendarSearch] = useState(emptyCalendarSearch)

  const [isCalendarSearchOpen, setIsCalendarSearchOpen] = useState(false)

  const [eventTitleFilter, setEventTitleFilter] = useState('')

  const [prefsHydrated, setPrefsHydrated] = useState(false)
  const savePrefsTimerRef = useRef(null)
  const prefsAuthErrorRef = useRef(false)

  const GUEST_SELECTED_KEY = 'kalendasGuestSelectedCalendarIds'
  const GUEST_TRACKED_KEY = 'kalendasGuestTrackedCalendarIds'

  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`
      try { window.localStorage.setItem('kalendasAuthToken', String(token)) } catch (_) {}
    } else {
      delete axios.defaults.headers.common.Authorization
      try { window.localStorage.removeItem('kalendasAuthToken') } catch (_) {}
    }
  }
  
  // UI States
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedCalendarIds, setExpandedCalendarIds] = useState([]);

  const [isCalendarDetailsOpen, setIsCalendarDetailsOpen] = useState(false)
  const [calendarDetails, setCalendarDetails] = useState(null)

  const [pendingCalendarDelete, setPendingCalendarDelete] = useState(null)
  const [pendingEventDelete, setPendingEventDelete] = useState(null)

  const [avatarBroken, setAvatarBroken] = useState(false);
  
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingCalendar, setEditingCalendar] = useState(null)

  const notify = (message, type = 'success') => setToast({ message, type });

  const handleOpenNotifications = () => {
    setIsNotificationsOpen(true)
  }

  const handleMarkNotificationRead = async (id) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
    } catch (error) {
      const msg = error.response?.data?.error || error.message
      notify(`Error marcando notificación: ${msg}`, 'error')
    }
  }

  const handleDeleteNotification = async (id) => {
    try {
      await notificationService.remove(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (error) {
      const msg = error.response?.data?.error || error.message
      notify(`Error eliminando notificación: ${msg}`, 'error')
    }
  }

  // Carga inicial de datos
  const loadData = async () => {
    try {
      // allSettled: si un microservicio cae, no dejamos la UI vacía.
      const promises = [
        calendarService.getAll(),
        eventService.getAll()
      ]
      
      if (!user?.isGuest) {
        const recipientEmail = String(user?.email || '').trim()
        promises.push(notificationService.getAll(recipientEmail ? { recipientEmail } : undefined))
      }

      const results = await Promise.allSettled(promises)
      const [calsRes, evsRes, notifsRes] = results

      if (calsRes.status === 'fulfilled') setCalendars(calsRes.value)
      if (evsRes.status === 'fulfilled') setEvents(evsRes.value)
      if (notifsRes && notifsRes.status === 'fulfilled') setNotifications(notifsRes.value)
    } catch (error) {
      console.error("Error cargando datos:", error);
      // No mostramos toast aquí para no spamear al cargar, solo si es acción del usuario
    }
  };

  // Si hay usuario en localStorage pero no hay sesión/cookie válida, fuerza relogin.
  useEffect(() => {
    if (!user?.email) {
      setSessionChecked(true)
      return
    }

    let cancelled = false
    const validateSession = async () => {
      try {
        const res = await axios.get(`${apiBaseUrl}/token`)
        if (res.data?.token) {
          setAuthToken(res.data.token)
        }
      } catch (err) {
        if (cancelled) return
        const status = err?.response?.status
        if (status === 401) {
          setUser(null)
          window.localStorage.removeItem('kalendasUser')
          setAuthToken(null)
        }
      } finally {
        if (!cancelled) setSessionChecked(true)
      }
    }
    validateSession()
    return () => { cancelled = true }
  }, [user?.email])

  const handleAdvancedSearch = async (filters = {}) => {
    if (!user) return

    const { scope = 'both', keywords, organizer, startDate, endDate } = filters
    const hasAny = Boolean((keywords && String(keywords).trim()) || (organizer && String(organizer).trim()) || startDate || endDate)

    // If cleared, restore normal load
    if (!hasAny) {
      await loadData()
      return
    }

    try {
      const calendarParams = {}
      const eventParams = {}

      if (keywords && String(keywords).trim()) {
        // Calendars: title search; Events: description/title search
        calendarParams.title = String(keywords).trim()
        eventParams.description = String(keywords).trim()
      }
      if (organizer && String(organizer).trim()) {
        calendarParams.organizer = String(organizer).trim()
        eventParams.organizer = String(organizer).trim()
      }
      if (startDate) {
        // Calendars use startDate range; Events use startTime range
        calendarParams.startDate = startDate
        eventParams.startAfter = startDate
      }
      if (endDate) {
        calendarParams.endDate = endDate
        eventParams.startBefore = `${endDate}T23:59:59.999Z`
      }

      const tasks = []
      if (scope === 'both' || scope === 'calendars') {
        tasks.push(calendarService.getAll(calendarParams).then(setCalendars))
      }
      if (scope === 'both' || scope === 'events') {
        tasks.push(eventService.getAll(eventParams).then(setEvents))
      }

      await Promise.all(tasks)
    } catch (error) {
      const msg = error.response?.data?.error || error.message
      notify(`Error en búsqueda: ${msg}`, 'error')
    }
  }

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  // Restore token on refresh
  useEffect(() => {
    try {
      const t = window.localStorage.getItem('kalendasAuthToken')
      if (t) setAuthToken(t)
    } catch (_) {
      // ignore
    }
  }, [])

  // Reset de estado dependiente de usuario: evita que al cambiar de cuenta
  // se hereden selecciones/paneles/filtros del usuario anterior.
  const prevSessionKeyRef = useRef(null)
  useEffect(() => {
    const sessionKey = user?.isGuest ? 'guest' : (user?.email || null)
    const prevSessionKey = prevSessionKeyRef.current
    if (sessionKey === prevSessionKey) return

    prevSessionKeyRef.current = sessionKey

    // Cancela cualquier guardado pendiente del usuario anterior
    if (savePrefsTimerRef.current) {
      clearTimeout(savePrefsTimerRef.current)
      savePrefsTimerRef.current = null
    }

    // Estado por usuario
    setSelectedCalendarIds([])
    setTrackedCalendarIds([])
    setExpandedCalendarIds([])

    // Estado UI local (no debería persistir entre cuentas)
    setCalendarSearch(emptyCalendarSearch)
    setIsCalendarSearchOpen(false)
    setEventTitleFilter('')
    setIsUserMenuOpen(false)
    setMobileOpen(false)
    setIsEventModalOpen(false)
    setIsCalendarModalOpen(false)
    setIsImportModalOpen(false)
    setIsSettingsOpen(false)
    setIsNotificationsOpen(false)
    setEditingEvent(null)

    // Token: no lo reutilizamos entre cuentas
    setAuthToken(null)
  }, [user?.email, user?.isGuest])

  // Hidrata preferencias (cross-browser) desde backend; fallback a localStorage
  useEffect(() => {
    if (user?.isGuest) {
      // Persistencia del invitado SOLO en este navegador (localStorage)
      try {
        const savedSelected = window.localStorage.getItem(GUEST_SELECTED_KEY)
        const savedTracked = window.localStorage.getItem(GUEST_TRACKED_KEY)
        if (savedSelected) {
          const parsed = JSON.parse(savedSelected)
          if (Array.isArray(parsed)) setSelectedCalendarIds(parsed)
        }
        if (savedTracked) {
          const parsed = JSON.parse(savedTracked)
          if (Array.isArray(parsed)) setTrackedCalendarIds(parsed)
        }
      } catch (_e) {
        // ignore
      } finally {
        setPrefsHydrated(true)
      }
      return
    }
    const email = user?.email
    if (!email) {
      setPrefsHydrated(false)
      return
    }

    let cancelled = false
    setPrefsHydrated(false)

    const hydrate = async (retry = true) => {
      try {
        const prefs = await preferencesService.get()
        if (cancelled) return
        if (prefs && typeof prefs === 'object') {
          if (Array.isArray(prefs.selectedCalendarIds)) setSelectedCalendarIds(prefs.selectedCalendarIds)
          if (Array.isArray(prefs.trackedCalendarIds)) setTrackedCalendarIds(prefs.trackedCalendarIds)
        }
        prefsAuthErrorRef.current = false
        setPrefsHydrated(true)
        return
      } catch (err) {
        // 401 aquí significa: no hay cookie de sesión válida (auth_token).
        // No bloqueamos la entrada: simplemente usamos fallback local y desactivamos guardado remoto.
        if (!cancelled && err?.response?.status === 401) {
          if (retry) {
            // Reintento por si validateSession aún no ha actualizado el token
            setTimeout(() => hydrate(false), 1000)
            return
          }
          prefsAuthErrorRef.current = true
        }
        // fallback
      }

      try {
        const selectedKey = `kalendasSelectedCalendarIds:${email}`
        const trackedKey = `kalendasTrackedCalendarIds:${email}`
        const savedSelected = window.localStorage.getItem(selectedKey)
        const savedTracked = window.localStorage.getItem(trackedKey)
        if (savedSelected) {
          const parsed = JSON.parse(savedSelected)
          if (Array.isArray(parsed)) setSelectedCalendarIds(parsed)
        }
        if (savedTracked) {
          const parsed = JSON.parse(savedTracked)
          if (Array.isArray(parsed)) setTrackedCalendarIds(parsed)
        }
      } catch (_err) {
        // ignore
      } finally {
        if (!cancelled) setPrefsHydrated(true)
      }
    }

    hydrate()
    return () => { cancelled = true }
  }, [user?.email])

  // Cache en localStorage (mismo navegador)
  useEffect(() => {
    if (user?.isGuest) {
      try {
        window.localStorage.setItem(GUEST_SELECTED_KEY, JSON.stringify(selectedCalendarIds))
      } catch (_) {
        // ignore
      }
      return
    }
    const email = user?.email
    if (!email) return
    const key = `kalendasSelectedCalendarIds:${email}`
    try {
      window.localStorage.setItem(key, JSON.stringify(selectedCalendarIds))
    } catch (_) {
      // ignore
    }
  }, [user?.email, user?.isGuest, selectedCalendarIds])

  useEffect(() => {
    if (user?.isGuest) {
      try {
        window.localStorage.setItem(GUEST_TRACKED_KEY, JSON.stringify(trackedCalendarIds))
      } catch (_) {
        // ignore
      }
      return
    }
    const email = user?.email
    if (!email) return
    const key = `kalendasTrackedCalendarIds:${email}`
    try {
      window.localStorage.setItem(key, JSON.stringify(trackedCalendarIds))
    } catch (_) {
      // ignore
    }
  }, [user?.email, user?.isGuest, trackedCalendarIds])

  // Persistencia cross-browser (debounced)
  useEffect(() => {
    if (!user?.email) return
    if (!prefsHydrated) return

    if (savePrefsTimerRef.current) clearTimeout(savePrefsTimerRef.current)
    savePrefsTimerRef.current = setTimeout(async () => {
      try {
        await preferencesService.save({ trackedCalendarIds, selectedCalendarIds })
        prefsAuthErrorRef.current = false
      } catch (err) {
        if (err?.response?.status === 401) {
          // Si no hay sesión remota, evitamos reintentos continuos.
          prefsAuthErrorRef.current = true
          setPrefsHydrated(false)
        }
        // ignore (fallback: localStorage)
      }
    }, 600)

    return () => {
      if (savePrefsTimerRef.current) clearTimeout(savePrefsTimerRef.current)
    }
  }, [user?.email, prefsHydrated, trackedCalendarIds, selectedCalendarIds])

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      // Siempre cerramos el menú de usuario al (re)entrar.
      setIsUserMenuOpen(false)
      if (credentialResponse.isGuest) {
        // Inicio limpio: el flujo de invitado debe empezar vacío al entrar desde Login.
        // La persistencia (selecciones) aplica únicamente entre refresh mientras sigues como invitado.
        try {
          window.localStorage.removeItem(GUEST_SELECTED_KEY)
          window.localStorage.removeItem(GUEST_TRACKED_KEY)
        } catch (_) {}

        // No reutilizamos token previo
        setAuthToken(null)
        setNotifications([])
        setSelectedCalendarIds([])
        setTrackedCalendarIds([])
        setExpandedCalendarIds([])
        setEditingEvent(null)
        setEditingCalendar(null)
        setSessionChecked(true)

        const guestUser = { 
          email: null, 
          name: 'Invitado', 
          picture: null,
          isGuest: true 
        }
        setUser(guestUser)
        // Persistimos invitado para que un refresh mantenga el modo invitado.
        try { window.localStorage.setItem('kalendasUser', JSON.stringify(guestUser)) } catch (_) {}
        notify('Has entrado como invitado')
        return
      }

      const decoded = jwtDecode(credentialResponse.credential);
      const loginRes = await axios.post(`${apiBaseUrl}/auth/login`, { token: credentialResponse.credential }, { withCredentials: true });
      const appToken = loginRes?.data?.token
      if (appToken) setAuthToken(appToken)
      
      // Usamos la respuesta del servidor para saber si es admin (basado en variables de entorno)
      const userData = { 
        ...decoded, 
        isAdmin: loginRes.data.isAdmin 
      };
      
      setUser(userData);
      window.localStorage.setItem('kalendasUser', JSON.stringify(userData));
      notify(`Bienvenido, ${decoded.name}`);
    } catch (err) {
      notify('Error de conexión con el servidor', 'error');
    }
  };

  const handleLogout = () => {
    // Limpia también la cookie httpOnly del gateway
    axios.post(`${apiBaseUrl}/auth/logout`).catch(() => {})
    googleLogout();

    // Cierra menús/overlays abiertos
    setIsUserMenuOpen(false)
    setMobileOpen(false)

    // Limpia estado local (para que el ciclo reinicie)
    setSelectedCalendarIds([])
    setTrackedCalendarIds([])
    setExpandedCalendarIds([])
    setNotifications([])
    setEditingEvent(null)
    setEditingCalendar(null)

    setUser(null);
    window.localStorage.removeItem('kalendasUser');
    try {
      window.localStorage.removeItem(GUEST_SELECTED_KEY)
      window.localStorage.removeItem(GUEST_TRACKED_KEY)
    } catch (_) {}
    setAuthToken(null)
    notify('Has cerrado sesión', 'info');
  };

  // --- Handlers Lógicos ---

  const handleCreateCalendar = async (calendarData) => {
    try {
      if (user?.isGuest) {
        notify('Debes iniciar sesión para crear calendarios', 'error');
        return;
      }
      const organizerEmail = user?.email;
      const organizer = user?.name || organizerEmail;

      if (!organizerEmail) {
        notify('Debes iniciar sesión para crear calendarios', 'error');
        return;
      }

      const payload = {
        ...calendarData,
        organizer,
        organizerEmail
      };

      const newCal = await calendarService.create(payload);
      setCalendars([...calendars, newCal]); // Actualización optimista
      notify(`Calendario "${newCal.title}" creado`);
      setIsCalendarModalOpen(false);
      loadData(); // Respaldo para asegurar IDs correctos
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateCalendar = async (calendarData) => {
    try {
      if (!editingCalendar?.id) return
      if (user?.isGuest) {
        notify('Debes iniciar sesión para modificar calendarios', 'error')
        return
      }
      const organizerEmail = user?.email
      if (!organizerEmail && !user?.isAdmin) {
        notify('Debes iniciar sesión para modificar calendarios', 'error')
        return
      }

      // Mantener organizer/organizerEmail del calendario (requeridos por el backend)
      const { id, _id, subCalendars, createdAt, updatedAt, ...rest } = editingCalendar
      const payload = {
        ...rest,
        ...calendarData,
        organizerEmail: String(editingCalendar.organizerEmail || organizerEmail),
        organizer: String(editingCalendar.organizer || user?.name || organizerEmail)
      }

      const updated = await calendarService.update(editingCalendar.id, payload)
      setCalendars(prev => prev.map(c => (c.id === updated.id ? updated : c)))
      notify('Calendario actualizado')
      setIsCalendarModalOpen(false)
      setEditingCalendar(null)
      loadData()
    } catch (error) {
      const msg = error?.response?.data?.error || error?.message
      notify(`Error actualizando calendario: ${msg}`, 'error')
    }
  }

  const handleSaveEvent = async (eventData) => {
    // La lógica de upload de imágenes YA se hizo en EventForm, aquí recibimos URLs
    try {
      if (user?.isGuest) {
        notify('Debes iniciar sesión para guardar eventos', 'error')
        return
      }
      const organizer = user?.email || user?.name
      if (!organizer) {
        notify('Debes iniciar sesión para guardar eventos', 'error')
        return
      }

      const payload = {
        ...eventData,
        organizer
      }

      if (editingEvent) {
        const updated = await eventService.update(editingEvent.id, payload);
        setEvents(events.map(e => e.id === updated.id ? updated : e));
        notify('Evento actualizado correctamente');
      } else {
        const created = await eventService.create(payload);
        setEvents([...events, created]);
        notify('Evento creado correctamente');
      }
      setIsEventModalOpen(false);
      setEditingEvent(null);
    } catch (error) {
      const msg = error.response?.data?.error || error.message;
      notify(`Error guardando evento: ${msg}`, 'error');
    }
  };

  const handleImportSuccess = (res) => {
    setIsImportModalOpen(false);

    const importedId = res?.calendar?.id || res?.calendar?._id || null
    const importedTitle = res?.calendar?.title || res?.title || 'Importado'
    const eventsFound = Number(res?.eventsFound ?? 0)
    const eventsCreated = Number(res?.eventsCreated ?? 0)
    const eventsFailed = Number(res?.eventsFailed ?? 0)
    const sampleErrors = Array.isArray(res?.sampleErrors) ? res.sampleErrors : []

    // Auto-selecciona el calendario importado para que sus eventos se vean sin pasos extra.
    if (importedId) {
      setSelectedCalendarIds(prev => (prev.includes(importedId) ? prev : [...prev, importedId]))
      setTrackedCalendarIds(prev => (prev.includes(importedId) ? prev : [...prev, importedId]))
    }

    loadData();

    if (eventsFound > 0) {
      if (eventsCreated > 0) {
        notify(`Calendario "${importedTitle}" importado: ${eventsCreated}/${eventsFound} eventos`, 'success')
      } else {
        const extra = sampleErrors.length ? ` (${sampleErrors[0]})` : ''
        notify(`Calendario "${importedTitle}" importado, pero 0 eventos creados${extra}`, 'error')
      }
    } else {
      notify(`Calendario "${importedTitle}" importado (sin eventos en el ICS)`, 'info')
    }

    if (eventsFailed > 0 && eventsCreated > 0) {
      notify(`Aviso: ${eventsFailed} eventos fallaron al crearse`, 'info')
    }
  };

  const handleImportError = (msg) => {
    notify(`Error importando calendario: ${msg}`, 'error')
  }

  const handleApplySettingsToAll = async () => {
      const preference = localStorage.getItem('notification_preference') || 'email';
      const me = String(user?.email || '')
      const myCalendars = calendars.filter(c => String(c.organizerEmail || '') === me);
      
      if(myCalendars.length === 0) {
          notify('No tienes calendarios propios', 'info');
          return;
      }
      
      notify('Actualizando configuración...', 'info');
      try {
        await Promise.all(myCalendars.map(cal => calendarService.update(cal.id, { ...cal, notificationChannel: preference })));
        notify('Configuración aplicada a todos');
        setIsSettingsOpen(false);
      } catch (e) {
        notify('Error al actualizar preferencias', 'error');
      }
  };

  const handleSyncCalendar = async (id, title) => {
    try {
      notify(`Sincronizando "${title}"...`, 'info')
      const res = await calendarService.sync(id)
      notify(`Sincronizado: ${res.eventsCreated} eventos actualizados`)
      loadData()
    } catch (error) {
      const msg = error.response?.data?.error || error.message
      notify(`Error sincronizando: ${msg}`, 'error')
    }
  }

  const handleRemoveCalendar = async (id, title) => {
      setPendingCalendarDelete({ id, title })
  };

  const confirmDeleteCalendar = async () => {
    if (!pendingCalendarDelete?.id) return
    const { id, title } = pendingCalendarDelete
    try {
      await calendarService.remove(id)
      setCalendars(prev => prev.filter(c => c.id !== id))
      setEvents(prev => prev.filter(e => e.calendar !== id))
      notify('Calendario eliminado')
    } catch (_e) {
      notify('Error eliminando calendario', 'error')
    } finally {
      setPendingCalendarDelete(null)
    }
  }

  const confirmDeleteEvent = async () => {
    if (!pendingEventDelete?.id) return
    if (user?.isGuest) {
      notify('Debes iniciar sesión para eliminar eventos', 'error')
      setPendingEventDelete(null)
      return
    }
    try {
      await eventService.remove(pendingEventDelete.id)
      setEvents(prev => prev.filter(e => e.id !== pendingEventDelete.id))
      notify('Evento eliminado')
      setIsEventModalOpen(false)
      setEditingEvent(null)
    } catch (error) {
      const msg = error?.response?.data?.error || error?.message
      notify(`Error eliminando evento: ${msg}`, 'error')
    } finally {
      setPendingEventDelete(null)
    }
  }

  // --- RENDER ---

  if (!user) return <LoginScreen onSuccess={handleLoginSuccess} onError={() => notify('Error en Login Google', 'error')} />;
  if (!user?.isGuest && user?.email && !sessionChecked) return null;

  const SidebarContent = (
    <div className="flex flex-col h-full">
      <div className="space-y-2">
        {!user?.isGuest && (
          <Button onClick={() => { setEditingCalendar(null); setIsCalendarModalOpen(true) }} className="w-full gap-2 shadow-blue-200/50">
            <Plus size={18} /> Nuevo Calendario
          </Button>
        )}
        <div className="grid grid-cols-2 gap-2">
          {!user?.isGuest && (
            <Button variant="secondary" className="gap-2" onClick={() => setIsImportModalOpen(true)}>
              <Upload size={16} /> Importar
            </Button>
          )}
          {!user?.isGuest && (
            <Button variant="secondary" className="gap-2" onClick={() => setIsSettingsOpen(true)}>
              <Settings size={16} /> Ajustes
            </Button>
          )}
        </div>
      </div>
      
      <div className="mt-4 flex-1 overflow-y-auto">
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Buscar calendarios</h3>
            <Button
              variant="secondary"
              onClick={() => setIsCalendarSearchOpen(v => !v)}
              type="button"
              className="h-8 px-2 text-[11px] whitespace-nowrap max-w-[150px] truncate"
            >
              {isCalendarSearchOpen
                ? 'Ocultar'
                : ((calendarSearch.title || calendarSearch.keywords || calendarSearch.organizer || calendarSearch.fromDate || calendarSearch.toDate)
                  ? 'Mostrar (con filtros)'
                  : 'Mostrar')}
            </Button>
          </div>

          {isCalendarSearchOpen && (
            <div className="mt-3">
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-xs text-slate-500">Busca y decide qué añadir/visualizar.</p>
                <Button
                  variant="secondary"
                  onClick={() => setCalendarSearch(emptyCalendarSearch)}
                  type="button"
                  className="h-8 px-3 text-xs whitespace-nowrap"
                >
                  Limpiar
                </Button>
              </div>

              <div className="space-y-2">
                <input
                  value={calendarSearch.title}
                  onChange={(e) => setCalendarSearch(s => ({ ...s, title: e.target.value }))}
                  placeholder="Nombre"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
                <input
                  value={calendarSearch.keywords}
                  onChange={(e) => setCalendarSearch(s => ({ ...s, keywords: e.target.value }))}
                  placeholder="Palabras clave"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
                <input
                  value={calendarSearch.organizer}
                  onChange={(e) => setCalendarSearch(s => ({ ...s, organizer: e.target.value }))}
                  placeholder="Organizador"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={calendarSearch.fromDate}
                    onChange={(e) => setCalendarSearch(s => ({ ...s, fromDate: e.target.value }))}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                  <input
                    type="date"
                    value={calendarSearch.toDate}
                    onChange={(e) => setCalendarSearch(s => ({ ...s, toDate: e.target.value }))}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>
              </div>

              <p className="mt-2 text-[11px] text-slate-400">
                Los calendarios externos no aparecen en el lateral hasta que los añades.
              </p>

              {(() => {
                const list = Array.isArray(calendars) ? calendars : []
                const hasAnyFilter = Boolean(
                  (calendarSearch.title && calendarSearch.title.trim()) ||
                  (calendarSearch.keywords && calendarSearch.keywords.trim()) ||
                  (calendarSearch.organizer && calendarSearch.organizer.trim()) ||
                  calendarSearch.fromDate ||
                  calendarSearch.toDate
                )

                if (!hasAnyFilter) return null

                const normalizeTokens = (raw) =>
                  String(raw || '')
                    .split(/[;,]|\s+/)
                    .map(s => s.trim())
                    .filter(Boolean)

                const matchesCalendar = (cal) => {
                  const title = String(cal.title || '')
                  const desc = String(cal.description || '')
                  const organizer = String(cal.organizer || '')
                  const organizerEmail = String(cal.organizerEmail || '')

                  if (calendarSearch.title && calendarSearch.title.trim()) {
                    const q = calendarSearch.title.trim().toLowerCase()
                    if (!title.toLowerCase().includes(q)) return false
                  }

                  if (calendarSearch.organizer && calendarSearch.organizer.trim()) {
                    const q = calendarSearch.organizer.trim().toLowerCase()
                    if (!organizer.toLowerCase().includes(q) && !organizerEmail.toLowerCase().includes(q)) return false
                  }

                  if (calendarSearch.fromDate || calendarSearch.toDate) {
                    const sd = cal.startDate ? new Date(cal.startDate) : null
                    if (!sd || isNaN(sd)) return false
                    if (calendarSearch.fromDate) {
                      const from = new Date(`${calendarSearch.fromDate}T00:00:00.000Z`)
                      if (!isNaN(from) && sd < from) return false
                    }
                    if (calendarSearch.toDate) {
                      const to = new Date(`${calendarSearch.toDate}T23:59:59.999Z`)
                      if (!isNaN(to) && sd > to) return false
                    }
                  }

                  if (calendarSearch.keywords && calendarSearch.keywords.trim()) {
                    const tokens = normalizeTokens(calendarSearch.keywords)
                    const kw = Array.isArray(cal.keywords) ? cal.keywords.map(k => String(k || '').toLowerCase()) : []
                    const haystack = `${title} ${desc}`.toLowerCase()
                    for (const t of tokens) {
                      const tt = t.toLowerCase()
                      const inKeywords = kw.some(k => k.includes(tt))
                      const inText = haystack.includes(tt)
                      if (!inKeywords && !inText) return false
                    }
                  }

                  return true
                }

                const byParent = new Map()
                for (const cal of list) {
                  const pid = cal.parentId || null
                  const arr = byParent.get(pid) || []
                  arr.push(cal)
                  byParent.set(pid, arr)
                }

                const getDescendantIds = (id) => {
                  const out = []
                  const stack = [id]
                  const visited = new Set([id])
                  while (stack.length) {
                    const cur = stack.pop()
                    const children = byParent.get(cur) || []
                    for (const ch of children) {
                      if (visited.has(ch.id)) continue
                      visited.add(ch.id)
                      out.push(ch.id)
                      stack.push(ch.id)
                    }
                  }
                  return out
                }

                const norm = (v) => String(v || '').trim().toLowerCase()
                const isOwned = (cal) => {
                  const me = norm(user?.email)
                  if (!me) return false
                  const byEmail = norm(cal?.organizerEmail)
                  const byOrganizer = norm(cal?.organizer)
                  return (byEmail && byEmail === me) || (byOrganizer && byOrganizer === me)
                }

                const addToList = (cal) => {
                  if (isOwned(cal)) return
                  setTrackedCalendarIds(prev => (prev.includes(cal.id) ? prev : [...prev, cal.id]))
                  setExpandedCalendarIds(prev => (prev.includes(cal.id) ? prev : [...prev, cal.id]))
                }

                const removeFromList = (cal) => {
                  setTrackedCalendarIds(prev => prev.filter(x => x !== cal.id))
                  setSelectedCalendarIds(prev => prev.filter(x => x !== cal.id))
                }

                const visualizeFull = (cal) => {
                  addToList(cal)
                  const ids = [cal.id, ...getDescendantIds(cal.id)]
                  setSelectedCalendarIds(prev => {
                    const s = new Set(prev)
                    for (const x of ids) s.add(x)
                    return Array.from(s)
                  })
                }

                const resultsAll = list.filter(matchesCalendar)
                const results = resultsAll.slice(0, 10)

                return (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Resultados</h4>
                      <span className="text-[11px] text-slate-400">{resultsAll.length}</span>
                    </div>

                    {results.length === 0 ? (
                      <p className="text-sm text-slate-500">No hay resultados.</p>
                    ) : (
                      <div className="space-y-2">
                        {results.map(cal => {
                          const mine = isOwned(cal)
                          const tracked = trackedCalendarIds.includes(cal.id)

                          return (
                            <div key={cal.id} className="rounded-lg border border-slate-200 bg-white p-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{cal.title}</p>
                                <p className="text-xs text-slate-500 truncate">{String(cal.organizer || cal.organizerEmail || '')}</p>

                                <div className="mt-2 flex flex-col gap-2">
                                  {!mine && (
                                    <Button
                                      variant="secondary"
                                      onClick={() => (tracked ? removeFromList(cal) : addToList(cal))}
                                      type="button"
                                      className="h-8 px-3 whitespace-nowrap w-full"
                                    >
                                      {tracked ? 'Quitar' : 'Añadir'}
                                    </Button>
                                  )}
                                  <Button
                                    onClick={() => visualizeFull(cal)}
                                    type="button"
                                    className="h-8 px-3 whitespace-nowrap w-full"
                                  >
                                    Visualizar
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {resultsAll.length > 10 && (
                      <p className="mt-2 text-[11px] text-slate-400">Mostrando 10 de {resultsAll.length}.</p>
                    )}
                  </div>
                )
              })()}
            </div>
          )}
        </div>

        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">Calendarios</h3>
        <div className="space-y-1">
          {(() => {
            const list = Array.isArray(calendars) ? calendars : []
            const byId = new Map(list.map(c => [String(c.id), c]))

            // Construye el árbol. Si un calendario tiene parentId pero el padre no existe
            // (p.ej. se borró el padre), lo tratamos como raíz para no "perderlo" en el lateral.
            const byParent = new Map()
            for (const cal of list) {
              const rawPid = cal.parentId ? String(cal.parentId) : null
              const pid = rawPid && byId.has(rawPid) ? rawPid : null
              const arr = byParent.get(pid) || []
              arr.push(cal)
              byParent.set(pid, arr)
            }
            for (const [k, arr] of byParent.entries()) {
              arr.sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')))
              byParent.set(k, arr)
            }

            const getDescendantIds = (id) => {
              const out = []
              const stack = [id]
              const visited = new Set()
              visited.add(id)
              while (stack.length) {
                const cur = stack.pop()
                const children = byParent.get(cur) || []
                for (const ch of children) {
                  if (visited.has(ch.id)) continue
                  visited.add(ch.id)
                  out.push(ch.id)
                  stack.push(ch.id)
                }
              }
              return out
            }

            const norm = (v) => String(v || '').trim().toLowerCase()
            const isOwned = (cal) => {
              if (user?.isGuest) return false
              const me = norm(user?.email)
              if (!me) return false
              const byEmail = norm(cal?.organizerEmail)
              const byOrganizer = norm(cal?.organizer)
              return (byEmail && byEmail === me) || (byOrganizer && byOrganizer === me)
            }

            const addWithAncestors = (set, id) => {
              const sid = String(id)
              set.add(sid)
              let cur = byId.get(sid)
              while (cur && cur.parentId) {
                const pid = String(cur.parentId)
                set.add(pid)
                cur = byId.get(pid)
              }
            }

            const visibleIds = (() => {
              const s = new Set()

              // Invitado: por defecto la lista empieza vacía.
              // Solo mostramos lo que el invitado haya decidido visualizar (tracked/selected),
              // más su ruta (ancestros) y subcalendarios de los tracked.
              if (user?.isGuest) {
                for (const id of trackedCalendarIds) {
                  addWithAncestors(s, id)
                  for (const d of getDescendantIds(id)) {
                    s.add(String(d))
                  }
                }
                for (const id of selectedCalendarIds) {
                  addWithAncestors(s, id)
                }
                return s
              }

              // Propios: mostrar (y permitir navegar) siempre
              for (const cal of list) {
                if (isOwned(cal)) {
                  addWithAncestors(s, cal.id)
                }
              }

              // Añadidos a la lista: mostrar el árbol completo del calendario para poder elegir subcalendarios
              for (const id of trackedCalendarIds) {
                addWithAncestors(s, id)
                for (const d of getDescendantIds(id)) {
                  s.add(String(d))
                }
              }

              // Seleccionados: asegurar que siempre aparecen (y su ruta)
              for (const id of selectedCalendarIds) {
                addWithAncestors(s, id)
              }

              return s
            })()

            const toggleSelected = (id) => {
              const descendants = getDescendantIds(id)
              const ids = [id, ...descendants]

              const allSelected = ids.every(x => selectedCalendarIds.includes(x))
              if (allSelected) {
                setSelectedCalendarIds(prev => prev.filter(x => !ids.includes(x)))
              } else {
                setSelectedCalendarIds(prev => {
                  const s = new Set(prev)
                  for (const x of ids) s.add(x)
                  return Array.from(s)
                })
              }
            }

            const toggleExpanded = (id) => {
              setExpandedCalendarIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
            }

            const removeFromMyList = (id) => {
              setTrackedCalendarIds(prev => prev.filter(x => x !== id))
              setSelectedCalendarIds(prev => prev.filter(x => x !== id))
            }

            const renderNode = (cal, depth) => {
              if (!visibleIds.has(cal.id)) return null
              const children = byParent.get(cal.id) || []
              const hasChildren = children.length > 0
              const isExpanded = expandedCalendarIds.includes(cal.id)
              const ids = [cal.id, ...getDescendantIds(cal.id)]
              const isSelected = ids.every(x => selectedCalendarIds.includes(x))
              const isMyCal = isOwned(cal)
              const isTracked = trackedCalendarIds.includes(cal.id)

              return (
                <div key={cal.id} className="space-y-1">
                  <div
                    className={`flex items-center justify-between rounded-lg cursor-pointer text-sm transition-colors group ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                    style={{ paddingLeft: `${8 + depth * 14}px`, paddingRight: '8px' }}
                    onClick={() => toggleSelected(cal.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0 py-2">
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleExpanded(cal.id) }}
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500 flex-shrink-0"
                          aria-label={isExpanded ? 'Contraer' : 'Expandir'}
                        >
                          <span className={`text-xs transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                        </button>
                      ) : (
                        <span className="w-6 flex-shrink-0" />
                      )}
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? 'bg-blue-500' : 'bg-slate-300'}`} />
                      <span className="truncate">{cal.title}</span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setCalendarDetails(cal)
                          setIsCalendarDetailsOpen(true)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded transition-all"
                        title="Ver detalles"
                      >
                        <Info size={12} />
                      </button>

                      {!user?.isGuest && (isMyCal || user?.isAdmin) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingCalendar(cal)
                            setIsCalendarModalOpen(true)
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded transition-all"
                          title="Editar"
                        >
                          <Pencil size={12} />
                        </button>
                      )}

                      {!user?.isGuest && cal.sourceUrl && (isMyCal || user?.isAdmin) && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleSyncCalendar(cal.id, cal.title); }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 text-slate-400 hover:text-blue-600 rounded transition-all"
                          title="Sincronizar"
                        >
                          <RefreshCw size={12} />
                        </button>
                      )}

                      {!isMyCal && isTracked && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFromMyList(cal.id) }}
                          className="opacity-0 group-hover:opacity-100 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"
                          title="Quitar de mi lista"
                        >
                          Quitar
                        </button>
                      )}

                      {!user?.isGuest && (isMyCal || user?.isAdmin) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveCalendar(cal.id, cal.title); }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded transition-all"
                          title="Eliminar"
                        >
                          <LogOut size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {hasChildren && isExpanded && (
                    <div className="space-y-1">
                      {children.map(ch => renderNode(ch, depth + 1)).filter(Boolean)}
                    </div>
                  )}
                </div>
              )
            }

            const roots = byParent.get(null) || []
            const filteredRoots = roots.filter(r => visibleIds.has(r.id))

            // Empty-state en el lateral: sin calendarios visibles (p.ej. invitado recién entrado)
            if (filteredRoots.length === 0) {
              return (
                <p className="text-xs text-slate-400 italic px-2">
                  Sin calendarios seleccionados.
                </p>
              )
            }

            return filteredRoots.map(r => renderNode(r, 0)).filter(Boolean)
          })()}
        </div>
      </div>
    </div>
  );

  const AuthControl = (
    <div className="relative">
      <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 hover:bg-slate-100 p-1 rounded-full pr-3 transition-colors">
        {user.picture && !avatarBroken ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-8 h-8 rounded-full border border-slate-200 object-cover"
            referrerPolicy="no-referrer"
            onError={() => setAvatarBroken(true)}
          />
        ) : (
          <div className="w-8 h-8 rounded-full border border-slate-200 bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-semibold">
            {(user.given_name || user.name || user.email || '?').slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col items-start leading-tight hidden md:block">
          <span className="text-sm font-medium text-slate-700">{user.given_name || user.name}</span>
          {user.isAdmin && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 rounded-full border border-blue-100">ADMIN</span>}
        </div>
      </button>
      
      {isUserMenuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-2 border-b border-slate-50">
              <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email || 'Invitado'}</p>
            </div>
            <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
              <LogOut size={16} /> {user.isGuest ? 'Salir' : 'Cerrar Sesión'}
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Layout
      sidebarContent={SidebarContent}
      notificationCount={notifications.length}
      onNotificationClick={!user?.isGuest ? handleOpenNotifications : null}
      onMenuClick={() => setMobileOpen(!mobileOpen)}
      mobileOpen={mobileOpen}
      onMobileClose={() => setMobileOpen(false)}
      authControl={AuthControl}
    >
      <div className="flex flex-col h-full gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
             <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Mi Agenda</h1>
             <p className="text-slate-500 text-sm">
                {selectedCalendarIds.length 
                    ? `Visualizando ${selectedCalendarIds.length} calendario(s)` 
                    : 'Selecciona calendarios en el menú lateral'}
             </p>
          </div>
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
            <div className="w-full sm:w-72 flex gap-2">
              <input
                value={eventTitleFilter}
                onChange={(e) => setEventTitleFilter(e.target.value)}
                placeholder="Buscar eventos por nombre"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
              <Button
                variant="secondary"
                onClick={() => setEventTitleFilter('')}
                type="button"
                className="h-10"
              >
                Limpiar
              </Button>
            </div>

            {!user?.isGuest && (
              <Button onClick={() => { setEditingEvent(null); setIsEventModalOpen(true); }} className="w-full sm:w-auto gap-2 shadow-lg shadow-blue-200/50">
                <Plus size={20} /> Crear Evento
              </Button>
            )}
          </div>
        </div>

        {(() => {
          // IMPORTANT: nunca mostrar "todos los eventos" por defecto.
          // Los eventos solo se visualizan si pertenecen a calendarios seleccionados.
          const base = (!prefsHydrated)
            ? []
            : (selectedCalendarIds.length > 0
              ? events.filter(e => selectedCalendarIds.includes(e.calendar))
              : [])

          const q = String(eventTitleFilter || '').trim().toLowerCase()
          const filtered = q
            ? base.filter(e => String(e.title || '').toLowerCase().includes(q))
            : base

          return (
            <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-auto">
              <CalendarView
                events={filtered}
                onSelectEvent={(event) => { setEditingEvent(event); setIsEventModalOpen(true); }}
              />
            </div>
          )
        })()}
      </div>

      <Modal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        title="Notificaciones"
      >
        <NotificationList
          notifications={notifications}
          onMarkAsRead={handleMarkNotificationRead}
          onDelete={handleDeleteNotification}
        />
      </Modal>

      {/* --- MODALES --- */}

      {(() => {
        const canEditEditingEvent = (() => {
          if (!editingEvent) return true
          if (!user) return false
          if (user?.isAdmin) return true
          const me = String(user?.email || '')
          const eventOrganizer = String(editingEvent?.organizer || '')
          if (me && eventOrganizer && me === eventOrganizer) return true
          const cal = calendars.find(c => c.id === editingEvent?.calendar)
          const calOrganizer = String(cal?.organizerEmail || cal?.organizer || '')
          return Boolean(me && calOrganizer && me === calOrganizer)
        })()

        return (
      <Modal 
        isOpen={isEventModalOpen} 
        onClose={() => setIsEventModalOpen(false)} 
        title={editingEvent ? "Detalles del Evento" : "Nuevo Evento"}
        showCloseButton={canEditEditingEvent}
      >
        <EventForm 
           initialData={editingEvent}
           calendars={calendars}
           user={user}
           onClose={() => setIsEventModalOpen(false)}
           onSave={handleSaveEvent}
           onRequestDelete={() => {
             if (editingEvent?.id) setPendingEventDelete(editingEvent)
           }}
        />
      </Modal>
        )
      })()}

      <Modal
        isOpen={isCalendarDetailsOpen}
        onClose={() => { setIsCalendarDetailsOpen(false); setCalendarDetails(null) }}
        title="Detalles del calendario"
      >
        {calendarDetails ? (
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-slate-800 font-semibold">{calendarDetails.title || 'Sin título'}</p>
              <p className="text-slate-500 text-xs">{String(calendarDetails.organizer || calendarDetails.organizerEmail || '')}</p>
            </div>

            {calendarDetails.description && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Descripción</p>
                <p className="text-slate-700 whitespace-pre-wrap">{calendarDetails.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inicio</p>
                <p className="text-slate-700">{calendarDetails.startDate ? new Date(calendarDetails.startDate).toLocaleString() : '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fin</p>
                <p className="text-slate-700">{calendarDetails.endDate ? new Date(calendarDetails.endDate).toLocaleString() : '—'}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Palabras clave</p>
              {Array.isArray(calendarDetails.keywords) && calendarDetails.keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-1">
                  {calendarDetails.keywords.slice(0, 30).map((k, idx) => (
                    <span key={`${k}-${idx}`} className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {String(k)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-700">—</p>
              )}
            </div>

            {calendarDetails.sourceUrl && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Origen (importado)</p>
                <a
                  className="text-blue-600 hover:underline break-all"
                  href={calendarDetails.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {calendarDetails.sourceUrl}
                </a>
                <p className="text-xs text-slate-500 mt-1">
                  Última sync: {calendarDetails.lastSyncedAt ? new Date(calendarDetails.lastSyncedAt).toLocaleString() : '—'}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={Boolean(pendingCalendarDelete?.id)}
        onClose={() => setPendingCalendarDelete(null)}
        title="Eliminar calendario"
        footer={(
          <>
            <Button variant="secondary" type="button" onClick={() => setPendingCalendarDelete(null)}>Cancelar</Button>
            <Button type="button" onClick={confirmDeleteCalendar} className="gap-2">
              <Trash2 size={16} /> Eliminar
            </Button>
          </>
        )}
      >
        <p className="text-sm text-slate-700">
          ¿Seguro que quieres borrar "{pendingCalendarDelete?.title}" y todos sus eventos?
        </p>
      </Modal>

      <Modal
        isOpen={Boolean(pendingEventDelete?.id)}
        onClose={() => setPendingEventDelete(null)}
        title="Eliminar evento"
        footer={(
          <>
            <Button variant="secondary" type="button" onClick={() => setPendingEventDelete(null)}>Cancelar</Button>
            <Button type="button" onClick={confirmDeleteEvent} className="gap-2">
              <Trash2 size={16} /> Eliminar
            </Button>
          </>
        )}
      >
        <p className="text-sm text-slate-700">
          ¿Seguro que quieres eliminar este evento?
        </p>
      </Modal>

      <Modal 
        isOpen={isCalendarModalOpen} 
        onClose={() => setIsCalendarModalOpen(false)} 
        title={editingCalendar ? 'Editar Calendario' : 'Crear Calendario'}
      >
        <CalendarForm 
          initialData={editingCalendar}
          onSubmit={editingCalendar ? handleUpdateCalendar : handleCreateCalendar}
          onClose={() => setIsCalendarModalOpen(false)}
          availableCalendars={calendars}
        />
      </Modal>

      <Modal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        title="Importar Calendario"
      >
        <ImportIcs onImportSuccess={handleImportSuccess} onImportError={handleImportError} />
      </Modal>

      <SettingsDialog 
        open={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onApplyToAll={handleApplySettingsToAll}
      />

      {/* Toast Notification System */}
      {toast.message && (
        <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast({ ...toast, message: '' })} 
        />
      )}

    </Layout>
  );
};

export default App;