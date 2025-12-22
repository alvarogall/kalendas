import React from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Send } from 'lucide-react';

const CommentForm = ({ onSubmit, text, onTextChange }) => (
  <div className="flex flex-col gap-3 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
    <textarea
      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px] resize-y"
      placeholder="Escribe un comentario..."
      value={text}
      onChange={onTextChange}
    />
    <div className="flex justify-end">
      <Button type="button" onClick={onSubmit} size="sm" className="gap-2">
        <Send size={16} /> Comentar
      </Button>
    </div>
  </div>
);

export default CommentForm;