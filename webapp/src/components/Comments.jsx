import React from 'react';
import { Trash2, User } from 'lucide-react';

const Comments = ({ comments, onRemoveComment }) => {
  if (!comments || comments.length === 0) {
    return (
      <div className="py-6 text-center text-slate-400 text-sm bg-slate-50 rounded-lg border border-slate-100 border-dashed">
        No hay comentarios aún. ¡Sé el primero!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <User size={16} />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {comment.user}
              </p>
              {typeof onRemoveComment === 'function' && (
                <button
                  type="button"
                  onClick={() => onRemoveComment(comment.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50"
                  title="Eliminar comentario"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {comment.text}
            </p>
            
            <p className="text-xs text-slate-400 mt-2">
              {new Date(comment.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Comments;