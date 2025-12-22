import React, { useEffect, useMemo, useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Loader2 } from 'lucide-react';

const CalendarForm = ({ onSubmit, onClose, availableCalendars = [], initialData = null }) => {
  const isEditing = Boolean(initialData?.id)

  const initialFormState = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return {
      title: initialData?.title || '',
      description: initialData?.description || '',
      keywords: Array.isArray(initialData?.keywords) ? initialData.keywords.join(', ') : '',
      startDate: initialData?.startDate ? String(initialData.startDate).slice(0, 10) : today,
      endDate: initialData?.endDate ? String(initialData.endDate).slice(0, 10) : '',
      parentId: initialData?.parentId ? String(initialData.parentId) : '',
      notificationChannel: initialData?.notificationChannel || (localStorage.getItem('notification_preference') || 'email')
    }
  }, [initialData])

  const [formData, setFormData] = useState(initialFormState);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData(initialFormState)
    setErrors({})
  }, [initialFormState])

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'El título es obligatorio.';
    if (formData.title.trim() && formData.title.trim().length < 3) newErrors.title = 'El título debe tener al menos 3 caracteres.';
    if (!formData.startDate) newErrors.startDate = 'La fecha de inicio es obligatoria.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const calendarData = {
        title: formData.title,
        description: formData.description,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        parentId: formData.parentId || null,
        notificationChannel: formData.notificationChannel || 'email'
      };
      
      // await es crucial aquí para esperar a que la petición termine
      await onSubmit(calendarData); 
    } catch (error) {
      const msg = error?.response?.data?.error || error?.message || ''
      if (String(msg).toLowerCase().includes('title')) {
        setErrors(prev => ({ ...prev, title: 'El título debe tener al menos 3 caracteres.' }))
      }
    } finally {
      setIsSubmitting(false); // ¡IMPORTANTE! Esto asegura que el botón se reactiva
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error al escribir
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const buildTreeOptions = () => {
    const calendars = Array.isArray(availableCalendars) ? availableCalendars : []
    const filtered = isEditing
      ? calendars.filter(c => String(c.id) !== String(initialData?.id))
      : calendars
    const byParent = new Map()
    for (const cal of filtered) {
      const pid = cal.parentId || null
      const list = byParent.get(pid) || []
      list.push(cal)
      byParent.set(pid, list)
    }
    for (const [k, list] of byParent.entries()) {
      list.sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')))
      byParent.set(k, list)
    }

    const out = []
    const visit = (parentId, depth) => {
      const children = byParent.get(parentId) || []
      for (const c of children) {
        const prefix = depth > 0 ? `${'—'.repeat(depth)} ` : ''
        out.push({ id: c.id, label: `${prefix}${c.title}` })
        visit(c.id, depth + 1)
      }
    }

    visit(null, 0)
    return out
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
      <Input
        label="Título"
        placeholder="Ej: Trabajo"
        value={formData.title}
        onChange={(e) => handleChange('title', e.target.value)}
        error={errors.title}
        required
        autoFocus
      />
      
      <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Descripción</label>
          <textarea
              className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none min-h-[80px] transition-all"
              placeholder="¿Para qué es este calendario?"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
          />
      </div>

      <Input
        label="Palabras clave"
        placeholder="reuniones, urgente, personal..."
        value={formData.keywords}
        onChange={(e) => handleChange('keywords', e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Fecha Inicio"
          type="date"
          value={formData.startDate}
          onChange={(e) => handleChange('startDate', e.target.value)}
          error={errors.startDate}
          required
        />
        <Input
          label="Fecha Fin (Opcional)"
          type="date"
          value={formData.endDate}
          onChange={(e) => handleChange('endDate', e.target.value)}
        />
      </div>
      
      <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Calendario Padre (Opcional)</label>
          <select
              className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
              value={formData.parentId}
              onChange={(e) => handleChange('parentId', e.target.value)}
          >
              <option value="">Ninguno (Calendario Principal)</option>
            {buildTreeOptions().map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-1 block">Notificaciones</label>
        <select
          className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
          value={formData.notificationChannel}
          onChange={(e) => handleChange('notificationChannel', e.target.value)}
        >
          <option value="email">Email</option>
          <option value="in-app">En la app</option>
        </select>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="animate-spin mr-2" size={16}/> Guardando...</> : (isEditing ? 'Guardar cambios' : 'Guardar Calendario')}
        </Button>
      </div>
    </form>
  );
};

export default CalendarForm;