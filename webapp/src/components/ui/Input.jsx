import React from 'react';

export const Input = ({ label, error, className = "", required, ...props }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && (
      <label className="text-sm font-medium text-slate-700 flex gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <input 
      className={`flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all
        ${error 
          ? 'border-red-300 focus:ring-red-200 focus:border-red-500 text-red-900 placeholder:text-red-300' 
          : 'border-slate-200 focus:ring-blue-100 focus:border-blue-500 text-slate-900'
        } ${className}`}
      {...props} 
    />
    {error && <span className="text-xs font-medium text-red-500 animate-in slide-in-from-top-1">{error}</span>}
  </div>
);