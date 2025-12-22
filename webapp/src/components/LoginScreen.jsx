import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Calendar } from 'lucide-react'; // Cambiado de MUI a Lucide

const LoginScreen = ({ onSuccess, onError }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center">
        <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200 rotate-3 transform transition-transform hover:rotate-0">
          <Calendar className="text-white" size={32} />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">
          Kalendas
        </h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Tu gestor de calendarios colaborativo. <br/>
          Simple, rápido y eficiente.
        </p>
        
        <div className="flex flex-col items-center gap-4 transform transition-transform hover:scale-105 duration-200">
          <GoogleLogin
            onSuccess={onSuccess}
            onError={onError}
            size="large"
            theme="outline"
            shape="pill"
            text="continue_with"
            width="280"
          />
          
          <button 
            onClick={() => onSuccess({ credential: null, isGuest: true })}
            className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors"
          >
            Entrar como invitado
          </button>
        </div>
        
        <p className="mt-8 text-xs text-slate-400">
          © {new Date().getFullYear()} Kalendas App. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;