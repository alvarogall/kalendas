import React from 'react';
import { Trash2, Circle, CheckCircle } from 'lucide-react';

const NotificationList = ({ notifications, onMarkAsRead, onDelete }) => {
  if (notifications.length === 0) {
    return <div className="p-8 text-center text-slate-400 text-sm">No tienes notificaciones pendientes</div>;
  }

  return (
    <div className="flex flex-col">
      {notifications.map((n) => (
        <div key={n.id} className="flex items-start gap-3 p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors">
            <button 
                onClick={() => onMarkAsRead(n.id)} 
                disabled={n.read}
                className={`mt-1 flex-shrink-0 ${n.read ? 'text-slate-300' : 'text-blue-500 hover:text-blue-600'}`}
            >
                {n.read ? <CheckCircle size={18} /> : <Circle size={18} fill="currentColor" className="text-blue-500" />}
            </button>
            
            <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.read ? 'text-slate-500' : 'text-slate-800 font-medium'}`}>
                    {n.message}
                </p>
                <span className="text-xs text-slate-400 mt-0.5 block capitalize">{n.channel}</span>
            </div>

            <button 
                onClick={() => onDelete(n.id)}
                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
                <Trash2 size={16} />
            </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationList;