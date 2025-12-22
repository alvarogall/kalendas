import React from 'react';
import { Menu, Bell, Calendar } from 'lucide-react';

const Layout = ({ 
  children, 
  sidebarContent, 
  notificationCount, 
  onNotificationClick,
  onMenuClick,
  mobileOpen,
  onMobileClose,
  authControl
}) => {
  
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-72 flex-col bg-white border-r border-slate-200 shadow-sm z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-md shadow-blue-200">
            <Calendar size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-slate-800 tracking-tight">Kalendas</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onMobileClose}></div>
          <aside className="absolute top-0 left-0 w-3/4 max-w-xs h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
             <div className="h-16 flex items-center px-6 border-b border-slate-100">
               <span className="text-lg font-bold text-slate-800">Menú</span>
             </div>
             <div className="flex-1 overflow-y-auto p-4">
                {sidebarContent}
             </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {onNotificationClick && (
              <button 
                  onClick={onNotificationClick} 
                  className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              >
                <Bell size={20} />
                {notificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </button>
            )}
            
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            
            {authControl}
          </div>
        </header>

        {/* Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;