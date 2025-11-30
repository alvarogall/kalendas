import React, { useState } from 'react'
import ICAL from 'ical.js'
// Asegúrate de que este servicio usa la misma base URL que los fetch manuales o usa rutas relativas
import calendarService from '../services/calendars'

export default function ImportIcs({ onImportSuccess }) {
  const [status, setStatus] = useState('idle') // idle | parsing | sending | done
  const [message, setMessage] = useState(null)
  const [progress, setProgress] = useState({ sent: 0, total: 0, errors: 0 })

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
      reader.readAsText(file)
    })
  }

  const onFileChange = async (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = '' // permitir seleccionar el mismo archivo de nuevo
    if (!file) return

    setMessage(null)
    if (!file.name.toLowerCase().endsWith('.ics')) {
      setMessage('Por favor selecciona un archivo .ics válido.')
      return
    }

    setStatus('parsing')
    let text
    try {
      text = await readFileAsText(file)
    } catch (err) {
      setMessage('Error leyendo el archivo: ' + err.message)
      setStatus('idle')
      return
    }

    let jcal, comp, vevents, events
    try {
      jcal = ICAL.parse(text)
      comp = new ICAL.Component(jcal)
      // Intentar VEVENT en mayúsculas y minúsculas por compatibilidad
      vevents = comp.getAllSubcomponents('vevent')
      if (!vevents || vevents.length === 0) {
        vevents = comp.getAllSubcomponents('VEVENT')
      }

      console.log('Contenido parseado (vevents):', vevents)

      events = vevents.map(v => new ICAL.Event(v))

      if (!events || events.length === 0) {
        setMessage('No se encontraron eventos en el archivo')
        setStatus('idle')
        return
      }
    } catch (err) {
      console.error('Error parsing .ics:', err)
      setMessage('El archivo .ics no es válido o no se pudo parsear.')
      setStatus('idle')
      return
    }

    // Paso 1: Crear el calendario
    const calendarName = file.name.replace(/\.ics$/i, '')
    setStatus('sending')
    setMessage('Creando calendario: ' + calendarName)

    // Calcular fechas min/max para el calendario
    const starts = events.map(ev => ev.startDate ? ev.startDate.toJSDate() : null).filter(Boolean)
    const ends = events.map(ev => ev.endDate ? ev.endDate.toJSDate() : null).filter(Boolean)
    const minStart = starts.length > 0 ? new Date(Math.min(...starts.map(d => d.getTime()))) : new Date()
    const maxEnd = ends.length > 0 ? new Date(Math.max(...ends.map(d => d.getTime()))) : null

    const calendarPayload = {
      title: calendarName,
      description: 'Importado desde archivo .ics',
      organizer: 'Imported',
      organizerEmail: 'import@local',
      startDate: minStart.toISOString(),
      endDate: maxEnd ? maxEnd.toISOString() : null,
      keywords: []
    }

    let calendarId = null
    let cjson = null
    try {
      cjson = await calendarService.create(calendarPayload)
      // Manejar posibles variaciones de ID (_id vs id)
      calendarId = cjson.id || cjson._id || (cjson._doc && cjson._doc._id)
      
      if (!calendarId) throw new Error('El backend no devolvió un ID de calendario válido.')
    } catch (err) {
      console.error(err)
      setMessage('Error al crear calendario: ' + err.message)
      setStatus('idle')
      return
    }

    // Paso 2: Crear eventos asociados
    setMessage('Calendario creado. Enviando eventos...')
    
    // Preparar payloads
    const payloads = events.map(ev => {
      const start = ev.startDate ? ev.startDate.toJSDate() : null
      const end = ev.endDate ? ev.endDate.toJSDate() : null
      
      // Aseguramos un organizador por defecto válido
      const organizerName = (cjson && (cjson.organizer || cjson.organizerEmail)) 
        ? (cjson.organizer || cjson.organizerEmail) 
        : 'Imported'

      return {
        title: ev.summary || 'Sin título',
        description: ev.description || '',
        startTime: start ? start.toISOString() : null,
        endTime: end ? end.toISOString() : null,
        startDate: start ? start.toISOString() : null,
        endDate: end ? end.toISOString() : null,
        
        organizer: organizerName,
        location: ev.location || 'Ubicación importada', 
        
        // <--- AÑADIR ESTO OBLIGATORIAMENTE PARA QUE NO FALLE
        coordinates: {
            type: 'Point',
            coordinates: [0, 0] 
        },
        calendar: calendarId
        }
    })

    setProgress({ sent: 0, total: payloads.length, errors: 0 })
    let sent = 0
    let errors = 0

    // Usamos ruta relativa /api/events suponiendo que Vite/Docker proxy redirige correctamente
    // Si falla, prueba a poner la URL completa de nuevo, pero relativo suele ser más seguro en Docker.
    const POST_URL = '/api/events' 

    for (const payload of payloads) {
      try {
        const res = await fetch(POST_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!res.ok) {
          errors++
          const errorText = await res.text()
          console.error(`Error guardando evento "${payload.title}":`, errorText)
        } else {
          sent++
        }
      } catch (err) {
        errors++
        console.error(`Error de red con evento "${payload.title}":`, err)
      }
      setProgress({ sent, total: payloads.length, errors })
    }

    setStatus('done')
if (errors > 0) {
        setMessage(`Import terminado con advertencias: ${sent} guardados, ${errors} fallidos.`)
    } else {
        // SI TODO SALIÓ BIEN, LLAMAMOS AL PADRE
        if (onImportSuccess) {
            // Pequeño timeout para que el usuario vea el "tick" verde antes de cerrar
            setTimeout(() => {
                onImportSuccess(calendarName)
            }, 1500) 
        }
        setMessage(`¡Éxito! Importado calendario "${calendarName}". Cerrando...`)
    }
  }

  return (
    <div style={{ maxWidth: 680, padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
      <label style={{ display: 'block', marginBottom: 8, fontWeight: '600' }}>
        Importar calendario externo (.ics)
      </label>
      <input type="file" accept=".ics,text/calendar" onChange={onFileChange} />
      <div style={{ marginTop: 10, fontSize: '0.9em', color: '#666' }}>
        <small>Selecciona un archivo .ics. Se creará un nuevo calendario y se añadirán sus eventos.</small>
      </div>

      {status === 'parsing' && <div style={{ marginTop: 12, color: 'blue' }}>Parseando archivo...</div>}
      {status === 'sending' && (
        <div style={{ marginTop: 12, fontWeight: 'bold' }}>
          Procesando: {progress.sent} guardados / {progress.errors} errores (Total: {progress.total})
        </div>
      )}
      
      {message && (
        <div style={{ 
          marginTop: 12, 
          padding: '8px',
          borderRadius: '4px',
          backgroundColor: message.includes('Éxito') ? '#d4edda' : (message.includes('advertencias') ? '#fff3cd' : '#f8d7da'),
          color: message.includes('Éxito') ? '#155724' : (message.includes('advertencias') ? '#856404' : '#721c24')
        }}>
          {message}
        </div>
      )}
    </div>
  )
}
