import React, { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Switch, 
  FormControlLabel, 
  Typography, 
  Divider, 
  Box 
} from '@mui/material'

export default function SettingsDialog({ open, onClose, onApplyToAll }) {
  const [isEmail, setIsEmail] = useState(true)

  // Al abrir el diálogo, leemos la preferencia actual
  useEffect(() => {
    if (open) {
      const pref = localStorage.getItem('notification_preference')
      // Si es 'in-app' es false, si es 'email' (o null/default) es true
      setIsEmail(pref !== 'in-app')
    }
  }, [open])

  // Al tocar el switch, guardamos inmediatamente en localStorage
  const handleChange = (e) => {
    const val = e.target.checked
    setIsEmail(val)
    localStorage.setItem('notification_preference', val ? 'email' : 'in-app')
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Configuración</DialogTitle>
      <DialogContent>
        {/* SECCIÓN 1: El Interruptor General */}
        <FormControlLabel
          control={<Switch checked={isEmail} onChange={handleChange} />}
          label="Recibir notificaciones por Email"
          sx={{ mt: 1 }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
          {isEmail 
            ? 'Te enviaremos un correo cuando alguien comente en tus eventos.' 
            : 'Las notificaciones aparecerán solo dentro de la aplicación (campana).'}
        </Typography>

        {/* SECCIÓN 2: Botón para actualizar calendarios antiguos */}
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666' }}>
                ACCIONES GLOBALES
            </Typography>
            
            <Button 
                variant="outlined" 
                size="small" 
                color="warning"
                onClick={onApplyToAll}
                sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
            >
                Aplicar "{isEmail ? 'Email' : 'App'}" a todos mis calendarios
            </Button>
            
            <Typography variant="caption" color="text.secondary">
                Usa esto si quieres actualizar tus calendarios antiguos con la preferencia seleccionada arriba.
            </Typography>
        </Box>

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}
