'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Left header slot, e.g. "Cancel". */
  left?: React.ReactNode;
  /** Right header slot. Defaults to a blue "Done" that closes the sheet. Pass null to hide. */
  right?: React.ReactNode | null;
  /** Use an ✕ circle on the right instead of "Done" (Voice / Speed sheets). */
  closeIcon?: boolean;
  children: React.ReactNode;
  className?: string;
  /** Full height sheet (share-save screen, feed search). */
  tall?: boolean;
}

/**
 * Bottom sheet (docs/ux-spec.md §1.3): grab handle, three-slot header, grouped rows inside.
 */
export default function Sheet({ open, onClose, title, left, right, closeIcon, children, className = '', tall }: SheetProps) {
  // Keep the content mounted only while open (plus the close animation), so hidden inputs
  // can't take focus and closed sheets cost nothing.
  const [mounted, setMounted] = useState(open);
  const [canPortal, setCanPortal] = useState(false);
  useEffect(() => { setCanPortal(true); }, []);
  useEffect(() => {
    if (open) { setMounted(true); return; }
    const t = setTimeout(() => setMounted(false), 250);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  const rightSlot = right === null ? null : right !== undefined ? right : closeIcon
    ? <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-group text-ink"><X size={16} /></button>
    : <button onClick={onClose} className="text-[16px] font-medium text-accent">Done</button>;

  // Rendered into <body> so a transformed ancestor (e.g. a swiping card) can't trap the fixed overlay.
  if (!canPortal || (!open && !mounted)) return null;
  return createPortal(
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-overlay/70 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        role="dialog"
        className={`absolute inset-x-0 bottom-0 mx-auto flex max-w-2xl flex-col rounded-t-sheet bg-surface-sheet pb-safe shadow-pop transition-transform duration-[220ms] ease-out ${open ? 'translate-y-0' : 'translate-y-full'} ${tall ? 'h-[92dvh]' : 'max-h-[85dvh]'} ${className}`}
      >
        <div className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-[#4a525b]" />
        {(title || left || rightSlot) && (
          <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center px-4 py-3">
            <div className="justify-self-start text-[16px] text-accent">{left}</div>
            <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
            <div className="justify-self-end">{rightSlot}</div>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{mounted ? children : null}</div>
      </div>
    </div>,
    document.body,
  );
}

/** Rounded group of 50px rows (label left, icon right). */
export function SheetGroup({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-3 overflow-hidden rounded-group bg-surface-group ${className}`}>{children}</div>;
}

interface RowProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  right?: React.ReactNode;
}

export function SheetRow({ label, icon, onClick, danger, disabled, right }: RowProps) {
  const cls = `flex h-[50px] w-full items-center justify-between border-t border-[#1d2329] px-4 text-left text-[16px] first:border-t-0 active:bg-surface-active ${disabled ? 'opacity-40' : ''} ${danger ? 'justify-center text-danger' : 'text-ink'}`;
  // A row that carries its own control (e.g. a Switch) can't be a <button>, since buttons can't nest.
  if (right) {
    return (
      <div role="button" tabIndex={0} onClick={disabled ? undefined : onClick} onKeyDown={e => { if (e.key === 'Enter' && !disabled) onClick?.(); }} className={`${cls} cursor-pointer`}>
        <span>{label}</span>
        {right}
      </div>
    );
  }
  return (
    <button onClick={onClick} disabled={disabled} className={cls}>
      <span>{label}</span>
      {icon && <span className="text-ink-2">{icon}</span>}
    </button>
  );
}

/** iOS-style switch used inside sheet rows. */
export function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={e => { e.stopPropagation(); onChange(!checked); }}
      className={`relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-[#4a525b]'}`}
    >
      <span className={`absolute left-0 top-[3px] h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[21px]' : 'translate-x-[3px]'}`} />
    </button>
  );
}
