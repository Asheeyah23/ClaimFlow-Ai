'use client';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, Brain } from 'lucide-react';
import { cn } from './utils';

type ToastType = 'success' | 'error' | 'info' | 'ai';

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  toast: (t: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const CONFIG: Record<ToastType, { icon: typeof Info; ring: string; iconColor: string }> = {
  success: { icon: CheckCircle2, ring: 'border-emerald-500/30', iconColor: 'text-emerald-400' },
  error: { icon: AlertTriangle, ring: 'border-rose-500/30', iconColor: 'text-rose-400' },
  info: { icon: Info, ring: 'border-teal-500/30', iconColor: 'text-teal-400' },
  ai: { icon: Brain, ring: 'border-orange-500/30', iconColor: 'text-orange-400' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => dismiss(id), 4800);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-full max-w-sm flex-col gap-2.5">
        {toasts.map((t) => {
          const { icon: Icon, ring, iconColor } = CONFIG[t.type];
          return (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl border bg-surface-800/90 p-3.5 pr-3 shadow-card backdrop-blur-xl animate-slide-up',
                ring
              )}
            >
              <div className={cn('mt-0.5 shrink-0', iconColor)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{t.title}</p>
                {t.description && <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{t.description}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-md p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
