import React, { useState } from 'react'
import ICAL from 'ical.js'

export default function ImportIcs() {
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
    e.target.value = '' // allow selecting same file again
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
      vevents = comp.getAllSubcomponents('vevent')
      events = vevents.map(v => new ICAL.Event(v))
      if (!events || events.length === 0) {
        setMessage('No se encontraron eventos (VEVENT) en el .ics.')
        setStatus('idle')
        return
      }
    } catch (err) {
      setMessage('El archivo .ics no es válido o no se pudo parsear.')
      setStatus('idle')
      return
    }

    // Paso 1: crear calendario usando el nombre del archivo (sin .ics)
    const calendarName = file.name.replace(/\.ics$/i, '')
    setStatus('sending')
    setMessage('Creando calendario: ' + calendarName)

    let calendarId = null
    try {
      const cres = await fetch('/api/calendars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: calendarName })
      })
      if (!cres.ok) {
        const txt = await cres.text()
        throw new Error('Error creando calendario: ' + (txt || cres.status))
      }
      const cjson = await cres.json()
      // puede venir como id o _id
      calendarId = cjson.id || cjson._id || (cjson && cjson._doc && cjson._doc._id)
      if (!calendarId) {
        // si viene con _id en string form
        calendarId = cjson._id || cjson.id
      }
      if (!calendarId) throw new Error('Respuesta inválida al crear calendario')
    } catch (err) {
      setMessage(err.message)
      setStatus('idle')
      return
    }

    // Paso 2: crear eventos asociados usando POST /calendars/{calendarId}/events
    setMessage('Calendario creado. Enviando eventos...')
    const payloads = events.map(ev => {
      const start = ev.startDate ? ev.startDate.toJSDate() : null
      const end = ev.endDate ? ev.endDate.toJSDate() : null
      return {
        // map to backend field names (title, description, startTime, endTime)
        title: ev.summary || 'Sin título',
        description: ev.description || '',
        startTime: start ? start.toISOString() : null,
        endTime: end ? end.toISOString() : null
      }
    })

    setProgress({ sent: 0, total: payloads.length, errors: 0 })
    let sent = 0
    let errors = 0

    for (const payload of payloads) {
      try {
        const res = await fetch(`/api/calendars/${encodeURIComponent(calendarId)}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) {
          errors++
          console.error('Error saving event', await res.text())
        } else {
          sent++
        }
      } catch (err) {
        errors++
        console.error('Network error saving event', err)
      }
      setProgress({ sent, total: payloads.length, errors })
    }

    setStatus('done')
    setMessage(`Import terminado: ${sent} guardados, ${errors} errores.`)
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <label style={{ display: 'block', marginBottom: 8, fontWeight: '600' }}>
        Importar calendario (.ics)
      </label>
      <input type="file" accept=".ics,text/calendar" onChange={onFileChange} />
      <div style={{ marginTop: 10 }}>
        <small>Selecciona un archivo .ics para importar sus eventos. El archivo creará un nuevo calendario.</small>
      </div>

      {status === 'parsing' && <div style={{ marginTop: 12 }}>Parseando archivo…</div>}
      {status === 'sending' && (
        <div style={{ marginTop: 12 }}>
          Enviando eventos: {progress.sent}/{progress.total} — errores: {progress.errors}
        </div>
      )}
      {message && <div style={{ marginTop: 12, color: message.toLowerCase().includes('error') ? 'crimson' : 'green' }}>{message}</div>}
    </div>
  )
}
