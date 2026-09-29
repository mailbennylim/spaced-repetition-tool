'use client';

import { useEffect, useState } from 'react';
import { Highlighter, MoreHorizontal, MessageSquare, X } from 'lucide-react';
import { HIGHLIGHT_COLORS, colorSolid } from '@/lib/colors';

interface Props {
  /** 'pending' = text selected but not yet highlighted; 'active' = an existing highlight is tapped. */
  mode: 'pending' | 'active' | null;
  /** Screen y to align the toolbar with. */
  y: number;
  color: string;
  onHighlight: () => void;
  onColor: (color: string) => void;
  onNote: () => void;
  onMore: () => void;
  onDelete: () => void;
}

/**
 * Vertical toolbar pinned to the right edge (docs/ux-spec.md §3.6, ref "Highlight function"):
 * pending → [pen]; active → [⋯] [note] [colour] [✕].
 */
export default function HighlightToolbar({ mode, y, color, onHighlight, onColor, onNote, onMore, onDelete }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  useEffect(() => { setPickerOpen(false); }, [mode, y]);
  if (!mode) return null;

  const btn = 'flex h-11 w-11 items-center justify-center text-ink-ui';
  const top = Math.max(72, Math.min((typeof window !== 'undefined' ? window.innerHeight : 800) - 260, y - 60));

  return (
    <div className="fixed right-2 z-40 flex items-start gap-2" style={{ top }} onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
      {pickerOpen && (
        <div className="mt-[102px] flex h-11 items-center gap-2 rounded-full bg-surface-sheet px-3 shadow-pop">
          {HIGHLIGHT_COLORS.map(c => (
            <button
              key={c.id}
              aria-label={c.label}
              onClick={() => { onColor(c.id); setPickerOpen(false); }}
              className={`h-6 w-6 rounded-full ${c.id === color ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-sheet' : ''}`}
              style={{ background: colorSolid(c.id) }}
            />
          ))}
        </div>
      )}
      <div className="flex flex-col overflow-hidden rounded-[22px] bg-surface-sheet shadow-pop">
        {mode === 'pending' ? (
          <button onClick={onHighlight} aria-label="Highlight" className={btn} style={{ color: colorSolid(color) }}>
            <Highlighter size={22} />
          </button>
        ) : (
          <>
            <button onClick={onMore} aria-label="More" className={btn}><MoreHorizontal size={20} /></button>
            <button onClick={onNote} aria-label="Add note" className={btn}><MessageSquare size={20} /></button>
            <button onClick={() => setPickerOpen(o => !o)} aria-label="Colour" className={btn}>
              <span className="h-5 w-5 rounded-full" style={{ background: colorSolid(color) }} />
            </button>
            <button onClick={onDelete} aria-label="Delete highlight" className={`${btn} text-[#f26d6d]`}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f26d6d]/20"><X size={18} /></span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
