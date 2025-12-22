import { Check } from 'lucide-react';

export const Checkbox = ({ checked, onChange, className = "" }) => (
  <button
    type="button"
    onClick={onChange}
    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
      checked 
        ? 'bg-blue-600 border-blue-600 text-white' 
        : 'bg-white border-slate-300 text-transparent hover:border-blue-400'
    } ${className}`}
  >
    <Check size={14} strokeWidth={3} />
  </button>
);