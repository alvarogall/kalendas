import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { MapPin, AlignLeft, Image as ImageIcon, Paperclip, Loader2, X, Trash2, ExternalLink, FileText, Download, MessageSquare } from 'lucide-react';
import CoordinateMap from './CoordinateMap';
import uploadService from '../services/upload';
import dropboxService from '../services/dropbox';
import commentService from '../services/comments';
import Comments from './Comments';
import CommentForm from './CommentForm';

const EventForm = ({ initialData, onSave, onClose, calendars = [], user, onRequestDelete }) => {
  const titleSectionRef = React.useRef(null)
  const startEndSectionRef = React.useRef(null)
  const calendarSectionRef = React.useRef(null)
  const imagesSectionRef = React.useRef(null)
  const attachmentsSectionRef = React.useRef(null)
  const locationSectionRef = React.useRef(null)
  const coordinatesSectionRef = React.useRef(null)

  const scrollToError = (nextErrors) => {
    if (!nextErrors || typeof nextErrors !== 'object') return

    const order = [
      ['title', titleSectionRef],
      ['start', startEndSectionRef],
      ['end', startEndSectionRef],
      ['calendar', calendarSectionRef],
      ['location', locationSectionRef],
      ['coordinates', coordinatesSectionRef],
      ['images', imagesSectionRef],
      ['attachments', attachmentsSectionRef]
    ]

    const first = order.find(([key]) => Boolean(nextErrors[key]))
    if (!first) return

    const ref = first[1]
    const el = ref?.current
    if (!el || typeof el.scrollIntoView !== 'function') return

    setTimeout(() => {
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } catch (_) {
        // ignore
      }
    }, 0)
  }

  // Estado del formulario
  const [form, setForm] = useState({
    title: '',
    start: '',
    end: '',
    description: '',
    location: '',
    calendar: '',
    // GeoJSON: { type: 'Point', coordinates: [lng, lat] }
    coordinates: null,
    // Mantenemos referencia a los arrays existentes del backend
    existingImages: [], 
    existingAttachments: []
  });

  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  // Estados temporales para nuevos archivos
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [newAttachments, setNewAttachments] = useState([]);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const calendarId = typeof form.calendar === 'object' && form.calendar?.id
    ? form.calendar.id
    : form.calendar

  // Determine ownership
  const isCalendarOwnedByUser = (cal) => {
    const owner = String(cal?.organizerEmail || cal?.organizer || '')
    const me = String(user?.email || '')
    return Boolean(owner && me && owner === me)
  }

  const ownedCalendars = Array.isArray(calendars)
    ? (user?.isAdmin ? calendars : calendars.filter(isCalendarOwnedByUser))
    : []

  const selectedCalendar = calendars.find(c => c.id === calendarId);
  const isEventOrganizer = Boolean(initialData?.organizer && user?.email && initialData.organizer === user.email);
  const isCalendarOrganizer = Boolean(isCalendarOwnedByUser(selectedCalendar));
  const isOwner = !initialData || isEventOrganizer || isCalendarOrganizer || user?.isAdmin;

  const canComment = Boolean(initialData?.id) && !isEventOrganizer;

  // Fetch comments
  useEffect(() => {
    if (initialData?.id) {
      commentService.getAll({ eventId: initialData.id })
        .then(setComments)
        .catch(console.error);
    }
  }, [initialData]);

  const handleAddComment = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!newComment.trim()) return;
    if (!initialData?.id) return;
    if (!user?.email) return;
    
    try {
      const added = await commentService.create({
        eventId: initialData.id,
        user: user.email, 
        text: newComment
      });
      setComments(prev => [added, ...prev]);
      setNewComment('');
    } catch (err) {
      console.error(err);
    }
  };

  // Carga inicial de datos
  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        start: initialData.startTime ? new Date(initialData.startTime).toISOString().slice(0, 16) : '',
        end: initialData.endTime ? new Date(initialData.endTime).toISOString().slice(0, 16) : '',
        description: initialData.description || '',
        location: initialData.location || '',
        calendar: (typeof initialData.calendar === 'object' && initialData.calendar?.id)
          ? initialData.calendar.id
          : (initialData.calendar || (ownedCalendars[0]?.id || '')),
        coordinates: initialData.coordinates || null,
        existingImages: Array.isArray(initialData.images) ? initialData.images : [],
        existingAttachments: Array.isArray(initialData.attachments) ? initialData.attachments : []
      });
    } else {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      
      setForm({
        title: '',
        start: now.toISOString().slice(0, 16),
        end: oneHourLater.toISOString().slice(0, 16),
        description: '',
        location: '',
        calendar: ownedCalendars[0]?.id || '',
        coordinates: null,
        existingImages: [],
        existingAttachments: []
      });
    }
  }, [initialData, calendars, user?.email]);

  // Validaciones
  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'El título es obligatorio.';
    if (form.title.trim() && form.title.trim().length < 3) newErrors.title = 'El título debe tener al menos 3 caracteres.';
    if (!form.start) newErrors.start = 'La fecha de inicio es obligatoria.';
    if (!form.end) newErrors.end = 'La fecha de fin es obligatoria.';
    if (!form.calendar) newErrors.calendar = 'Debes seleccionar un calendario.';
    if (!form.location.trim()) newErrors.location = 'La ubicación es obligatoria.';

    if (form.coordinates) {
      const coords = form.coordinates.coordinates
      if (!Array.isArray(coords) || coords.length !== 2) {
        newErrors.coordinates = 'Coordenadas inválidas. Usa el mapa.'
      }
    }
    
    if (form.start && form.end && new Date(form.start) > new Date(form.end)) {
        newErrors.end = 'La fecha de fin no puede ser anterior a la de inicio.';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      scrollToError(newErrors)
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setNewImageFiles(prev => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews(prev => [...prev, { name: file.name, dataUrl: reader.result }]);
      };
      reader.readAsDataURL(file);
    });

    // allow selecting same file again
    e.target.value = '';
  };

  const removeNewImage = (index) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    const updated = form.existingImages.filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, existingImages: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsUploading(true);

    try {
      // 1. Gestionar Arrays de Imágenes
      let finalImages = [...form.existingImages]; // Copiamos las que ya existían
      
      if (newImageFiles.length > 0) {
        try {
          const uploaded = await Promise.all(newImageFiles.map(f => uploadService.uploadImage(f)));
          finalImages = [...finalImages, ...uploaded];
        } catch (error) {
          const cloudinaryMsg =
            error?.response?.data?.error?.message ||
            error?.response?.data?.error ||
            error?.message ||
            'Error desconocido'

          setErrors(prev => ({
            ...prev,
            images: `Error subiendo imágenes: ${cloudinaryMsg}`
          }));
          scrollToError({ images: true })
          setIsUploading(false);
          return;
        }
      }

      // 2. Gestionar Arrays de Adjuntos
      let finalAttachments = [...form.existingAttachments];
      
      if (newAttachments.length > 0) {
        try {
          const uploaded = await Promise.all(newAttachments.map(f => dropboxService.uploadFile(f)));
          finalAttachments = [...finalAttachments, ...uploaded];
        } catch (error) {
          alert("Error crítico subiendo a Dropbox: " + error.message);
          scrollToError({ attachments: true })
          setIsUploading(false);
          return;
        }
      }

      // 3. Objeto Final
      const eventData = {
        title: form.title,
        startTime: new Date(form.start).toISOString(),
        endTime: new Date(form.end).toISOString(),
        description: form.description,
        location: form.location,
        calendar: form.calendar,
        coordinates: form.coordinates,
        images: finalImages,        // Array de strings
        attachments: finalAttachments // Array de strings
      };

      await onSave(eventData); // Enviamos al padre
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
      <div ref={titleSectionRef}>
      <Input 
        label="Título del evento"
        placeholder="Ej: Reunión de proyecto"
        value={form.title}
        onChange={e => {
            if (!isOwner) return;
            setForm({...form, title: e.target.value});
            if(errors.title) setErrors({...errors, title: null});
        }}
        error={errors.title}
        required={isOwner}
        autoFocus
        readOnly={!isOwner}
      />
      </div>
      
      <div ref={startEndSectionRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input 
          type="datetime-local" 
          label="Inicio" 
          value={form.start}
          onChange={e => {
            if (!isOwner) return;
            setForm({...form, start: e.target.value});
            if(errors.start) setErrors({...errors, start: null});
          }}
          error={errors.start}
          required={isOwner}
          readOnly={!isOwner}
        />
        <Input 
          type="datetime-local" 
          label="Fin" 
          value={form.end}
          onChange={e => {
            if (!isOwner) return;
            setForm({...form, end: e.target.value});
            if(errors.end) setErrors({...errors, end: null});
          }}
          error={errors.end}
          required={isOwner}
          readOnly={!isOwner}
        />
      </div>

      <div ref={calendarSectionRef}>
        <label className="text-sm font-medium text-slate-700 mb-1.5 flex gap-1">
            Calendario {isOwner && <span className="text-red-500">*</span>}
        </label>
        {isOwner ? (
        <select 
          className={`w-full h-10 rounded-lg border bg-white px-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all ${errors.calendar ? 'border-red-300' : 'border-slate-200'}`}
          value={calendarId}
          onChange={e => {
            setForm({...form, calendar: e.target.value});
            if(errors.calendar) setErrors({...errors, calendar: null});
          }}
        >
          {ownedCalendars.length === 0 && <option value="">-- Crea un calendario primero --</option>}

          {/* Si estamos editando y el evento está en un calendario no propio, mantenemos la opción visible (pero deshabilitada). */}
          {Boolean(initialData?.id) && calendarId && !ownedCalendars.some(c => c.id === calendarId) && (
            <option value={calendarId} disabled>
              {calendars.find(c => c.id === calendarId)?.title || 'Calendario externo'}
            </option>
          )}

          {ownedCalendars.map(cal => (
            <option key={cal.id} value={cal.id}>{cal.title}</option>
          ))}
        </select>
        ) : (
            <div className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 flex items-center text-sm text-slate-600">
            {calendars.find(c => c.id === calendarId)?.title || 'Calendario externo'}
            </div>
        )}
        {errors.calendar && <p className="text-xs text-red-500 mt-1">{errors.calendar}</p>}
      </div>

      {/* Sección Imágenes (Manejo de Arrays) */}
      {(isOwner || form.existingImages.length > 0) && (
      <div ref={imagesSectionRef} className="space-y-2">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <ImageIcon size={16} /> Imágenes
        </label>
        
        {/* Lista de imágenes existentes */}
        {form.existingImages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
                {form.existingImages.map((img, idx) => (
                    <div key={idx} className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 group">
                        <img src={img} alt={`Imagen ${idx}`} className="w-full h-full object-cover"/>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                            <a 
                                href={img} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors" 
                                title="Ver imagen"
                            >
                                <ExternalLink size={16}/>
                            </a>
                            {isOwner && (
                            <button 
                                type="button" 
                                onClick={() => removeExistingImage(idx)}
                                className="p-1.5 bg-red-500/80 hover:bg-red-600 rounded-full text-white backdrop-blur-sm transition-colors"
                                title="Eliminar"
                            >
                                <Trash2 size={16}/>
                            </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* Subida de nuevas imágenes */}
        {isOwner && (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer relative group">
          <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
          <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
            <p className="text-sm font-medium">+ Añadir imágenes</p>
          </div>
        </div>
        )}

        {errors.images && <p className="text-xs text-red-500">{errors.images}</p>}

        {isOwner && newImagePreviews.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {newImagePreviews.map((img, idx) => (
              <div key={`${img.name}-${idx}`} className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 group">
                <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewImage(idx)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                  title="Quitar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Dropbox (Archivos) */}
      {(isOwner || form.existingAttachments.length > 0) && (
      <div ref={attachmentsSectionRef}>
        <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
          <Paperclip size={16} /> Archivos Adjuntos
        </label>
        
        {/* Lista existentes */}
        {form.existingAttachments.length > 0 && (
            <div className="flex flex-col gap-2 mb-3">
                {form.existingAttachments.map((url, idx) => (
                    <div key={idx} className="text-sm text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 flex justify-between items-center group hover:bg-slate-100 transition-colors">
                        <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-3 flex-1 min-w-0 hover:text-blue-600 transition-colors"
                            title="Descargar archivo"
                        >
                            <div className="p-1.5 bg-white rounded-md border border-slate-200 text-blue-500">
                                <FileText size={16} />
                            </div>
                            <span className="truncate font-medium">{decodeURIComponent(url.split('/').pop().split('?')[0])}</span>
                            <Download size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-auto mr-2"/>
                        </a>
                        {isOwner && (
                        <button type="button" onClick={() => {
                            const updated = form.existingAttachments.filter((_, i) => i !== idx);
                            setForm({...form, existingAttachments: updated});
                        }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Eliminar">
                            <Trash2 size={16}/>
                        </button>
                        )}
                    </div>
                ))}
            </div>
        )}

        {isOwner && (
        <div className="flex gap-2 items-center">
          <input
            type="file"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length) setNewAttachments(prev => [...prev, ...files]);
              e.target.value = '';
            }}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors cursor-pointer"
          />
        </div>
        )}

        {isOwner && newAttachments.length > 0 && (
          <div className="mt-2 flex flex-col gap-1">
            {newAttachments.map((f, idx) => (
              <div key={`${f.name}-${idx}`} className="text-xs text-slate-700 bg-slate-50 p-1.5 rounded flex justify-between items-center">
                <span className="truncate max-w-[200px]">{f.name}</span>
                <button
                  type="button"
                  onClick={() => setNewAttachments(prev => prev.filter((_, i) => i !== idx))}
                  className="text-red-400 hover:text-red-600"
                  title="Quitar"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      <div ref={locationSectionRef} className="relative">
        <MapPin className="absolute left-3 top-9 text-slate-400" size={16} />
        <Input 
          label="Ubicación (Texto)" 
          placeholder="Ej: Sala de reuniones 1" 
          className="pl-9"
          value={form.location}
          onChange={e => {
            if (!isOwner) return;
            setForm({ ...form, location: e.target.value })
            if (errors.location) setErrors({ ...errors, location: null })
          }}
          error={errors.location}
          readOnly={!isOwner}
        />
      </div>

      <div ref={coordinatesSectionRef}>
        <CoordinateMap 
          coordinates={form.coordinates}
          onCoordinatesChange={(geoJson) => {
            if (!isOwner) return;
            if (geoJson && Array.isArray(geoJson.coordinates)) {
              setForm(prev => ({ ...prev, coordinates: geoJson }))
              if (errors.coordinates) setErrors(prev => ({ ...prev, coordinates: null }))
            } else {
              setForm(prev => ({ ...prev, coordinates: null }))
            }
          }}
          onLocationChange={(e) => isOwner && setForm(prev => ({ ...prev, location: e.target.value }))}
        />
      </div>

      {errors.coordinates && <p className="text-xs text-red-500 -mt-3">{errors.coordinates}</p>}

      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
          <AlignLeft size={16} /> Descripción
        </label>
        <textarea 
          className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none min-h-[100px]"
          placeholder="Añade detalles..."
          value={form.description}
          onChange={e => {
            if (!isOwner) return;
            setForm({...form, description: e.target.value})
          }}
          readOnly={!isOwner}
        />
      </div>

      {/* Sección Comentarios */}
      {initialData && (
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <MessageSquare size={16} /> Comentarios ({comments.length})
          </h4>

          {comments.length > 0 ? (
            <Comments comments={comments} />
          ) : (
            <p className="text-sm text-slate-400 italic mb-4">No hay comentarios.</p>
          )}

          {canComment && !user?.isGuest && (
            <CommentForm 
              text={newComment} 
              onTextChange={e => setNewComment(e.target.value)} 
              onSubmit={handleAddComment}
            />
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 sticky bottom-0 -mx-1 px-1 bg-white py-3 z-20">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isUploading}>
            {isOwner ? 'Cancelar' : 'Cerrar'}
        </Button>
        {Boolean(initialData?.id) && isOwner && !user?.isGuest && typeof onRequestDelete === 'function' && (
          <Button
            type="button"
            variant="secondary"
            onClick={onRequestDelete}
            disabled={isUploading}
            className="gap-2"
          >
            <Trash2 size={16} /> Eliminar
          </Button>
        )}
        {isOwner && (
        <Button type="submit" disabled={isUploading} className="min-w-[140px]">
          {isUploading ? <><Loader2 className="animate-spin mr-2" size={16}/> Guardando...</> : 'Guardar Evento'}
        </Button>
        )}
      </div>
    </form>
  );
};

export default EventForm;