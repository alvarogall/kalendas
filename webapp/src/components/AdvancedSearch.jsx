import React, { useState } from 'react';
import { Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

const AdvancedSearch = ({ onSearch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scope, setScope] = useState('both');
  const [keywords, setKeywords] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSearch = () => {
    onSearch({ scope, keywords, organizer, startDate, endDate });
  };

  const handleClear = () => {
    setScope('both');
    setKeywords('');
    setOrganizer('');
    setStartDate('');
    setEndDate('');
    onSearch({});
  };

  return (
    <div className="mb-2 bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <Filter size={16} className="text-blue-500"/>
            Búsqueda Avanzada
        </div>
        <button className="text-slate-400">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isOpen && (
        <div className="p-3 pt-0 flex flex-col gap-3 animate-in slide-in-from-top-2">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 flex gap-1">
              Buscar en
            </label>
            <select
              className="w-full h-10 rounded-lg border bg-white px-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all border-slate-200"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
            >
              <option value="both">Calendarios y eventos</option>
              <option value="calendars">Solo calendarios</option>
              <option value="events">Solo eventos</option>
            </select>
          </div>
          <Input
            label="Palabra clave"
            placeholder="Ej: Proyecto X"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
          <Input
            label="Organizador"
            placeholder="Ej: email / nombre"
            value={organizer}
            onChange={(e) => setOrganizer(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Desde"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="Hasta"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-xs h-8">
                <X size={14} className="mr-1"/> Limpiar
            </Button>
            <Button size="sm" onClick={handleSearch} className="text-xs h-8">
                Buscar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;