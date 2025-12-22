import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Upload, Loader2 } from 'lucide-react';
import calendarService from '../services/calendars';

const ImportIcs = ({ onImportSuccess, onImportError }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!url.trim()) return;
    setLoading(true);

    try {
      const res = await calendarService.importCalendar({ url: url.trim(), provider: 'Google Calendar' });
      if (typeof onImportSuccess === 'function') onImportSuccess(res);
    } catch (error) {
      const msg = error?.response?.data?.error || error.message
      if (typeof onImportError === 'function') onImportError(msg)
      else alert('Error importando calendario: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
        <Upload className="mx-auto h-10 w-10 text-slate-400 mb-2" />
        <p className="text-sm text-slate-600 mb-4">
          Pega el enlace <strong>ICS</strong> de Google Calendar para importar el calendario.
        </p>

        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
        />

        <p className="mt-3 text-xs text-slate-500">
          En Google Calendar: Ajustes del calendario → Integrar calendario → “Dirección secreta en formato iCal”.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleImport} disabled={!url.trim() || loading} className="w-full sm:w-auto">
          {loading ? <><Loader2 className="animate-spin mr-2" size={16}/> Importando...</> : 'Importar Google Calendar'}
        </Button>
      </div>
    </div>
  );
};

export default ImportIcs;