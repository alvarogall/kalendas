import React from 'react';
import { Search } from 'lucide-react';

const Filter = ({ label, value, onChange }) => (
  <div className="relative mb-4">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Search size={18} className="text-slate-400" />
    </div>
    <input
      type="text"
      className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:placeholder-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition duration-150 ease-in-out"
      placeholder={label || "Buscar..."}
      value={value}
      onChange={onChange}
    />
  </div>
);

export default Filter;