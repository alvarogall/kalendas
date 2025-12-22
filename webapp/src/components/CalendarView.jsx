import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const locales = { 'es': es };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const CustomToolbar = (toolbar) => {
  const goToBack = () => toolbar.onNavigate('PREV');
  const goToNext = () => toolbar.onNavigate('NEXT');
  const goToToday = () => toolbar.onNavigate('TODAY');

  const label = () => {
    const date = new Date(toolbar.date);
    return <span className="text-lg font-bold text-slate-800 capitalize">
      {format(date, 'MMMM yyyy', { locale: es })}
    </span>;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-b border-slate-100 gap-3 bg-white">
      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
        {label()}
        <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200 shadow-sm">
          <button type="button" onClick={goToBack} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600">
            <ChevronLeft size={20} />
          </button>
          <button type="button" onClick={goToToday} className="px-3 py-1 text-xs font-semibold text-slate-600 hover:text-blue-600 border-x border-transparent hover:border-slate-100">
            HOY
          </button>
          <button type="button" onClick={goToNext} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      
      <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-200 w-full sm:w-auto overflow-x-auto shadow-sm">
        {['month', 'week', 'day'].map(view => (
          <button
            key={view}
            type="button"
            onClick={() => toolbar.onView(view)}
            className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
              toolbar.view === view 
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
            }`}
          >
            {view === 'month' ? 'Mes' : view === 'week' ? 'Semana' : 'Día'}
          </button>
        ))}
      </div>
    </div>
  );
};

const CalendarView = ({ events, onSelectEvent }) => {
  const [view, setView] = useState('month');
  const [date, setDate] = useState(() => new Date());

  // Transformamos las fechas de string a Date para que BigCalendar no falle
  const calendarEvents = events.map(event => ({
    ...event,
    start: new Date(event.startTime),
    end: new Date(event.endTime),
  }));

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
      <div className="flex-1 min-h-0 p-1 sm:p-4"> 
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%', minHeight: 720 }}
          onSelectEvent={onSelectEvent}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          views={['month', 'week', 'day']}
          culture='es'
          components={{ toolbar: CustomToolbar }}
          messages={{ 
            showMore: total => `+${total} más`, 
            noEventsInRange: 'No hay eventos', 
            next: 'Siguiente', 
            previous: 'Anterior', 
            today: 'Hoy', 
            month: 'Mes', 
            week: 'Semana', 
            day: 'Día'
          }}
          eventPropGetter={(event) => {
            return {
              className: 'bg-blue-50 border-l-4 border-blue-500 text-blue-700 text-xs font-medium rounded-r-md shadow-sm hover:bg-blue-100 transition-colors',
              style: { backgroundColor: '#eff6ff', color: '#1d4ed8', border: 'none', borderLeft: '4px solid #3b82f6' }
            };
          }}
        />
      </div>
    </div>
  );
};

export default CalendarView;