import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopHeader } from '../components/layout/TopHeader';
import { Sidebar } from '../components/layout/Sidebar';
import { useRealtime } from '../hooks/useRealtime';
import { X, Bell } from 'lucide-react';

export const HospitalLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { alerts, dismissAlert } = useRealtime();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TopHeader onToggleSidebar={() => setSidebarOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {/* Incoming Realtime Alerts Banner */}
          {alerts.length > 0 && (
            <div className="mb-6 space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-900 text-xs shadow-xs animate-in fade-in slide-in-from-top-2"
                >
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600 animate-bounce" />
                    <span className="font-semibold">{alert.message}</span>
                    <span className="text-blue-500 text-[10px]">({alert.timestamp})</span>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-100/50"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Page Outlet */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};
