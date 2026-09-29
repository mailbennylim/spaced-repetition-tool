'use client';

import { Menu, Plus, MoreHorizontal, ChevronLeft } from 'lucide-react';

interface Props {
  title: string;
  onBrowse?: () => void;
  onAdd?: () => void;
  onMore?: () => void;
  onBack?: () => void;
}

/** List toolbar + big title (docs/ux-spec.md §3.2): ☰ · ⊕ · ⋯ then "Inbox". */
export default function ListHeader({ title, onBrowse, onAdd, onMore, onBack }: Props) {
  return (
    <header className="px-4 pt-safe">
      <div className="flex h-12 items-center justify-between">
        {onBack ? (
          <button onClick={onBack} aria-label="Back" className="-ml-2 flex h-10 w-10 items-center justify-center text-ink"><ChevronLeft size={24} /></button>
        ) : (
          <button onClick={onBrowse} aria-label="Browse" className="-ml-2 flex h-10 w-10 items-center justify-center text-ink"><Menu size={22} /></button>
        )}
        <div className="flex items-center gap-1">
          {onAdd && <button onClick={onAdd} aria-label="Add" className="flex h-10 w-10 items-center justify-center text-ink"><span className="flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] border-ink"><Plus size={14} /></span></button>}
          {onMore && <button onClick={onMore} aria-label="More" className="-mr-2 flex h-10 w-10 items-center justify-center text-ink"><span className="flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] border-ink"><MoreHorizontal size={14} /></span></button>}
        </div>
      </div>
      <h1 className="pb-2 pt-1 text-[28px] font-bold leading-8 text-ink">{title}</h1>
    </header>
  );
}
