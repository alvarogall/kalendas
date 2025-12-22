import React, { useState } from 'react';
import { Eye, Trash2, ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { Checkbox } from './ui/Checkbox';

const CalendarItem = ({ calendar, onRemoveCalendar, onToggleCalendar, selectedCalendarIds, onInspectCalendar, level = 0 }) => {
    const [isOpen, setIsOpen] = useState(false);
    const isSelected = selectedCalendarIds.includes(calendar.id);
    const subCalendars = calendar.subCalendars || [];
    const hasSubCalendars = subCalendars.length > 0;
    
    return (
        <div className="select-none">
            <div 
                className={`group flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/50' : ''}`}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={() => onToggleCalendar(calendar.id)}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <Checkbox checked={isSelected} onChange={() => onToggleCalendar(calendar.id)} />
                    
                    <span className={`text-sm truncate ${isSelected ? 'font-medium text-blue-700' : 'text-slate-600'}`}>
                        {calendar.title}
                    </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onInspectCalendar(calendar); }} 
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded"
                        title="Ver detalles"
                    >
                        <Eye size={14} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onRemoveCalendar(calendar.id, calendar.title); }} 
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-white rounded"
                        title="Eliminar"
                    >
                        <Trash2 size={14} />
                    </button>
                    {hasSubCalendars && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} 
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-white rounded ml-1"
                        >
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                    )}
                </div>
            </div>

            {hasSubCalendars && isOpen && (
                <div className="border-l border-slate-100 ml-4">
                    {subCalendars.map(sub => (
                        <CalendarItem 
                            key={sub.id} 
                            calendar={sub} 
                            onRemoveCalendar={onRemoveCalendar}
                            onToggleCalendar={onToggleCalendar}
                            selectedCalendarIds={selectedCalendarIds}
                            onInspectCalendar={onInspectCalendar}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const Calendars = ({ calendars, onRemoveCalendar, onToggleCalendar, selectedCalendarIds, onInspectCalendar }) => {
    // Filtramos solo los padres para el nivel raíz
    const rootCalendars = calendars.filter(calendar => !calendar.parentId);

    return (
        <div>
            <div className="flex items-center gap-2 mb-3 px-2">
                <Folder size={14} className="text-slate-400" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Mis Calendarios
                </h3>
            </div>
            <div className="flex flex-col gap-0.5">
                {rootCalendars.length > 0 ? (
                    rootCalendars.map(calendar => (
                        <CalendarItem
                            key={calendar.id}
                            calendar={calendar}
                            onRemoveCalendar={onRemoveCalendar}
                            onToggleCalendar={onToggleCalendar}
                            selectedCalendarIds={selectedCalendarIds}
                            onInspectCalendar={onInspectCalendar}
                        />
                    ))
                ) : (
                    <p className="px-2 text-xs text-slate-400 italic">No hay calendarios creados</p>
                )}
            </div>
        </div>
    );
};

export default Calendars;