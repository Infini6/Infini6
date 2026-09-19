import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { toastNotifier } from '../services/toastNotifier';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  addToast: (toast: { type?: ToastType; title: string; message?: string }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastItem = { id, type, title, message };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  }, [dismissToast]);

  const addToast = useCallback(
    (toast: { type?: ToastType; title: string; message?: string }) => {
      showToast(toast.type || 'info', toast.title, toast.message);
    },
    [showToast]
  );

  const showSuccess = useCallback((title: string, message?: string) => {
    showToast('success', title, message);
  }, [showToast]);

  const showError = useCallback((title: string, message?: string) => {
    showToast('error', title, message);
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string) => {
    showToast('info', title, message);
  }, [showToast]);

  React.useEffect(() => {
    return toastNotifier.subscribe((type, title, message) => {
      showToast(type, title, message);
    });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, addToast }}>
      {children}

      {/* Floating Toast Viewport */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';

          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all animate-in slide-in-from-bottom-5 duration-200',
                isSuccess
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : isError
                  ? 'bg-rose-50 border-rose-200 text-rose-950'
                  : 'bg-blue-50 border-blue-200 text-blue-950'
              )}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : isError ? (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                ) : (
                  <Info className="w-4 h-4 text-blue-600" />
                )}
              </div>

              <div className="flex-1">
                <h5 className="font-semibold text-xs leading-none">{toast.title}</h5>
                {toast.message && (
                  <p className="text-[11px] opacity-80 mt-1 leading-snug">{toast.message}</p>
                )}
              </div>

              <button
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
