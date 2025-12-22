import React, { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { Switch } from './ui/Switch'
import { Button } from './ui/Button'
import { Mail, Bell } from 'lucide-react'

export default function SettingsDialog({ open, onClose, onApplyToAll }) {
  const [isEmail, setIsEmail] = useState(true)

  useEffect(() => {
    if (open) {
      const pref = localStorage.getItem('notification_preference')
      setIsEmail(pref !== 'in-app')
    }
  }, [open])

  const handleChange = (checked) => {
    setIsEmail(checked)
    localStorage.setItem('notification_preference', checked ? 'email' : 'in-app')
  }

  const Footer = (
    <div className="w-full flex justify-end">
        <Button variant="ghost" onClick={onClose}>Cerrar</Button>
    </div>
  )

  return (
    <Modal open={open} isOpen={open} onClose={onClose} title="Configuración" footer={Footer}>
      <div className="flex flex-col gap-6">
        
        {/* Preferencia de Notificación */}
        <div className="flex items-start justify-between gap-4">
            <div>
                <h4 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                    {isEmail ? <Mail size={16}/> : <Bell size={16}/>}
                    Método de notificación
                </h4>
                <p className="text-sm text-slate-500 mt-1">
                    {isEmail 
                        ? 'Recibirás un correo electrónico cuando haya cambios.' 
                        : 'Solo verás avisos dentro de la aplicación.'}
                </p>
            </div>
            <Switch checked={isEmail} onChange={handleChange} />
        </div>

        <div className="h-px bg-slate-100 my-2"></div>

        {/* Acciones Globales */}
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
            <h5 className="text-xs font-bold text-orange-800 uppercase tracking-wide mb-2">
                Zona de Peligro / Global
            </h5>
            <p className="text-xs text-orange-600 mb-3">
                Si cambias la preferencia arriba, solo afecta a los nuevos calendarios. Usa esto para actualizar los viejos.
            </p>
            <Button 
                variant="secondary" 
                className="w-full justify-start text-xs h-8 bg-white border-orange-200 text-orange-700 hover:bg-orange-100"
                onClick={onApplyToAll}
            >
                Aplicar "{isEmail ? 'Email' : 'App'}" a todo
            </Button>
        </div>

      </div>
    </Modal>
  )
}