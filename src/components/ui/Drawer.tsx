'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Menu } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/** Left "Browse" drawer (docs/ux-spec.md §1.3): ~88% width, slides in from the left, page dimmed. */
export default function Drawer({ open, onClose, children }: DrawerProps) {
  const [canPortal, setCanPortal] = useState(false);
  useEffect(() => { setCanPortal(true); }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!canPortal) return null;
  return createPortal(
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-overlay/70 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`} />
      <aside
        className={`absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col overflow-y-auto bg-surface-1 pt-safe pb-safe transition-transform duration-[220ms] ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="px-4 pt-3">
          <button onClick={onClose} aria-label="Close browse" className="flex h-10 w-8 items-center text-ink"><Menu size={22} /></button>
          <h1 className="mb-4 mt-2 text-[28px] font-bold text-ink">Browse</h1>
        </div>
        <div className="flex-1 px-4 pb-6">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}

export function DrawerSection({ title, right, children }: { title?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      {title && (
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function DrawerGroup({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-group bg-bg">{children}</div>;
}
