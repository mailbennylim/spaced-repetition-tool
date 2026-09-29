'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, List, Info, Play, MoreHorizontal, MessageSquare, Inbox, Archive, ChevronsUpDown, Type, PanelRight, X, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  /** 'short' = articles/emails/rss (floating buttons + toolbar); 'long' = epub/pdf (tap to show bars). */
  layout: 'short' | 'long';
  title: string;
  progress: number;
  location: string;
  isFeed: boolean;
  /** Offset between current position and furthest progress → show "Return to X%". */
  returnTo: number | null;
  hideChrome: boolean;
  onBack: () => void;
  onContents: () => void;
  onListen: () => void;
  onInfo: () => void;
  onAppearance: () => void;
  onNotesAndTags: () => void;
  onToggleLocation: () => void;
  onMore: () => void;
  onReturn: () => void;
  onDismissReturn: () => void;
  /** Long-form: bars shown/hidden by tapping the page. */
  barsVisible: boolean;
  /** Find bar */
  find: { open: boolean; query: string; count: number; index: number } | null;
  onFindChange: (q: string) => void;
  onFindNext: (dir: 1 | -1) => void;
  onFindClose: () => void;
}

/**
 * Reading view chrome (docs/ux-spec.md §3.5): floating circles, purple progress line,
 * bottom toolbar, Return-to-X% chip, and the long-form top/bottom bars.
 */
export default function ReaderChrome(p: Props) {
  const circle = 'pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-sheet text-ink shadow-pop';
  const shown = p.layout === 'short' ? !p.hideChrome : p.barsVisible;

  return (
    <>
      {/* Top */}
      {p.layout === 'short' ? (
        <div className={`pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between px-3 pt-safe transition-opacity duration-200 ${shown ? 'opacity-100' : 'opacity-0'}`}>
          <div className="mt-3 flex gap-2">
            <button onClick={p.onBack} aria-label="Back" className={circle}><ChevronLeft size={24} /></button>
            <button onClick={p.onContents} aria-label="Contents" className={circle}><List size={22} /></button>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={p.onListen} aria-label="Listen" className={circle}><Play size={20} fill="currentColor" /></button>
            <button onClick={p.onInfo} aria-label="Info" className={circle}><Info size={22} /></button>
          </div>
        </div>
      ) : (
        <div className={`fixed inset-x-0 top-0 z-30 bg-reader-bg/95 pt-safe backdrop-blur transition-transform duration-200 ${shown ? 'translate-y-0' : '-translate-y-full'}`}>
          <div className="flex h-12 items-center gap-1 px-2">
            <button onClick={p.onBack} aria-label="Back" className="flex h-10 w-10 items-center justify-center text-ink"><ChevronLeft size={22} /></button>
            <button onClick={p.onContents} aria-label="Contents" className="flex h-10 w-10 items-center justify-center text-ink"><List size={20} /></button>
            <p className="flex-1 truncate text-center text-[13px] text-ink">{p.title}</p>
            <button onClick={p.onAppearance} aria-label="Appearance" className="flex h-10 w-10 items-center justify-center text-[15px] font-semibold text-ink">Aa</button>
            <button onClick={p.onInfo} aria-label="Info" className="flex h-10 w-10 items-center justify-center text-ink"><PanelRight size={20} /></button>
          </div>
        </div>
      )}

      {/* Find in document bar */}
      {p.find?.open && (
        <div className="fixed inset-x-0 z-40 mx-auto flex max-w-2xl items-center gap-2 bg-surface-sheet px-3 py-2 shadow-pop" style={{ top: 'calc(var(--safe-top) + 64px)' }}>
          <input autoFocus value={p.find.query} onChange={e => p.onFindChange(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') p.onFindNext(e.shiftKey ? -1 : 1); }} placeholder="Find in document..." className="h-9 flex-1 rounded-group bg-surface-group px-3 text-[15px] text-ink placeholder:text-ink-2 focus:outline-none" />
          <span className="w-12 text-center text-[12px] tabular-nums text-ink-2">{p.find.count ? `${p.find.index + 1}/${p.find.count}` : '0'}</span>
          <button onClick={() => p.onFindNext(-1)} aria-label="Previous result" className="text-ink"><ChevronUp size={20} /></button>
          <button onClick={() => p.onFindNext(1)} aria-label="Next result" className="text-ink"><ChevronDown size={20} /></button>
          <button onClick={p.onFindClose} className="ml-1 text-[14px] font-medium text-accent">Done</button>
        </div>
      )}

      {/* Return to X% */}
      {p.returnTo !== null && (
        <div className="fixed inset-x-0 z-30 flex items-center justify-center gap-2" style={{ bottom: 'calc(var(--safe-bottom) + 92px)' }}>
          <button onClick={p.onReturn} className="flex h-11 items-center gap-2 rounded-full bg-surface-sheet px-4 text-[17px] text-ink shadow-pop"><RotateCcw size={18} /> Return to {Math.round(p.returnTo * 100)}%</button>
          <button onClick={p.onDismissReturn} aria-label="Dismiss" className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-group text-ink shadow-pop"><X size={18} /></button>
        </div>
      )}

      {/* Bottom */}
      <div className={`fixed inset-x-0 bottom-0 z-30 bg-reader-bg transition-transform duration-200 ${shown ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="h-1 w-full"><div className="h-full bg-progress" style={{ width: `${Math.round(p.progress * 100)}%` }} /></div>
        {p.layout === 'short' ? (
          <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-6 pb-safe">
            <button onClick={p.onNotesAndTags} aria-label="Notes and tags" className="flex h-11 w-11 items-center justify-center text-ink"><MessageSquare size={22} /></button>
            {!p.isFeed ? (
              <button onClick={p.onToggleLocation} aria-label="Change location" className="flex h-11 items-center gap-1 rounded-full px-3 text-ink">
                {p.location === 'archive' ? <Archive size={22} /> : <Inbox size={22} />}<ChevronsUpDown size={14} className="text-ink-2" />
              </button>
            ) : <span className="w-11" />}
            <button onClick={p.onMore} aria-label="More" className="flex h-11 w-11 items-center justify-center text-ink"><span className="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-ink"><MoreHorizontal size={16} /></span></button>
          </div>
        ) : (
          <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 pb-safe">
            <span className="text-[13px] tabular-nums text-ink-2">{Math.round(p.progress * 100)}%</span>
            <button onClick={p.onMore} aria-label="More" className="flex h-11 w-11 items-center justify-center text-ink"><span className="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-ink-2"><MoreHorizontal size={16} /></span></button>
          </div>
        )}
      </div>
    </>
  );
}

/** Hide the floating chrome while scrolling down, show it again on scroll up or tap. */
export function useAutoHideChrome(enabled: boolean) {
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);
  useEffect(() => {
    if (!enabled) return;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 40) setHidden(false);
      else if (y > last.current + 12) setHidden(true);
      else if (y < last.current - 12) setHidden(false);
      last.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [enabled]);
  return [hidden, setHidden] as const;
}

export { Type };
