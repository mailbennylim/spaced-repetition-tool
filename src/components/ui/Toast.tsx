'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface ToastItem {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration: number;
}

interface ToastApi {
  toast: (message: string, opts?: { actionLabel?: string; onAction?: () => void; duration?: number }) => void;
}

const ToastContext = createContext<ToastApi>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const toast = useCallback<ToastApi['toast']>((message, opts) => {
    const id = ++counter.current;
    setItems(prev => [...prev.slice(-2), { id, message, actionLabel: opts?.actionLabel, onAction: opts?.onAction, duration: opts?.duration ?? 4000 }]);
  }, []);

  const dismiss = (id: number) => setItems(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 z-[100] flex flex-col items-center gap-2 px-4" style={{ bottom: 'calc(var(--tabbar-h) + var(--safe-bottom) + 12px)' }}>
        {items.map(t => <ToastView key={t.id} item={t} onDone={() => dismiss(t.id)} />)}
      </div>
    </ToastContext.Provider>
  );
}

function ToastView({ item, onDone }: { item: ToastItem; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, item.duration);
    return () => clearTimeout(timer);
  }, [item.duration, onDone]);

  return (
    <div className="pointer-events-auto flex w-full max-w-sm items-center justify-between gap-4 rounded-group bg-surface-popover px-4 py-3 text-[15px] text-ink shadow-pop">
      <span className="truncate">{item.message}</span>
      {item.actionLabel && (
        <button
          onClick={() => { item.onAction?.(); onDone(); }}
          className="shrink-0 font-semibold text-accent"
        >
          {item.actionLabel}
        </button>
      )}
    </div>
  );
}
