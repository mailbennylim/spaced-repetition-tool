'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Archive, Inbox, Trash2, Eye, EyeOff, BookmarkPlus } from 'lucide-react';
import type { DocumentSummary } from '@/lib/documents';
import { rowDate, timeLabel } from '@/lib/format';
import { Favicon, TypeIcon, typeLabel } from '@/components/ui/Icons';

export type SwipeAction = 'archive' | 'inbox' | 'delete' | 'save' | 'seen';

interface Props {
  doc: DocumentSummary;
  onMore: (doc: DocumentSummary) => void;
  /** Swipe right (→) and left (←) actions. */
  swipeRight?: SwipeAction;
  swipeLeft?: SwipeAction;
  onSwipe?: (doc: DocumentSummary, action: SwipeAction) => void;
  /** Where the reader should return to. */
  from?: string;
}

const SWIPE_META: Record<SwipeAction, { label: string; icon: React.ReactNode; bg: string }> = {
  archive: { label: 'Archive', icon: <Archive size={22} />, bg: 'bg-emerald-600' },
  inbox: { label: 'Move to Inbox', icon: <Inbox size={22} />, bg: 'bg-accent' },
  delete: { label: 'Delete', icon: <Trash2 size={22} />, bg: 'bg-danger' },
  save: { label: 'Save to Library', icon: <BookmarkPlus size={22} />, bg: 'bg-accent' },
  seen: { label: 'Seen', icon: <Eye size={22} />, bg: 'bg-surface-active' },
};

const THRESHOLD = 88;

/**
 * List row (docs/ux-spec.md §3.2 / §3.3): favicon + small caps source line, title with tag chips,
 * date · excerpt, author · time, 84×84 thumbnail, progress bar, ⋯ menu, swipe actions.
 */
export default function DocumentRow({ doc, onMore, swipeRight, swipeLeft, onSwipe, from }: Props) {
  const [dx, setDx] = useState(0);
  const start = useRef<{ x: number; y: number; active: boolean; horizontal: boolean | null } | null>(null);
  const [gone, setGone] = useState(false);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY, active: true, horizontal: null };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const s = start.current; if (!s?.active) return;
    const t = e.touches[0];
    const ddx = t.clientX - s.x, ddy = t.clientY - s.y;
    if (s.horizontal === null) {
      if (Math.abs(ddx) < 8 && Math.abs(ddy) < 8) return;
      s.horizontal = Math.abs(ddx) > Math.abs(ddy);
    }
    if (!s.horizontal) return;
    if ((ddx > 0 && !swipeRight) || (ddx < 0 && !swipeLeft)) { setDx(ddx / 4); return; }
    setDx(Math.max(-160, Math.min(160, ddx)));
  };
  const onTouchEnd = () => {
    const s = start.current; start.current = null;
    if (!s?.horizontal) { setDx(0); return; }
    if (dx > THRESHOLD && swipeRight) { fire(swipeRight, 1); return; }
    if (dx < -THRESHOLD && swipeLeft) { fire(swipeLeft, -1); return; }
    setDx(0);
  };
  const fire = (action: SwipeAction, dir: 1 | -1) => {
    if (navigator.vibrate) navigator.vibrate(8);
    if (action === 'seen') { setDx(0); onSwipe?.(doc, action); return; }
    setDx(dir * 420);
    setGone(true);
    setTimeout(() => onSwipe?.(doc, action), 180);
  };

  const meta = dx > 0 ? swipeRight : dx < 0 ? swipeLeft : undefined;
  const showBg = meta && Math.abs(dx) > 12;
  // Reference rows show the domain in small caps ("INMA.ORG"); feed items show the feed's name.
  const sourceLine = doc.isFeed && doc.feedTitle ? doc.feedTitle : doc.type === 'article' || doc.type === 'email' || doc.type === 'rss' ? (doc.domain || doc.siteName || typeLabel(doc.type)) : typeLabel(doc.type);
  const time = timeLabel(doc.wordCount, doc.progress);
  const dateStr = rowDate(doc.isFeed ? (doc.publishedAt || doc.savedAt) : doc.savedAt);
  const href = `/read/${doc.id}${from ? `?from=${encodeURIComponent(from)}` : ''}`;

  return (
    <div className={`relative overflow-hidden bg-bg transition-[max-height,opacity] duration-200 ${gone ? 'max-h-0 opacity-0' : 'max-h-[200px]'}`}>
      {showBg && meta && (
        <div className={`absolute inset-0 flex items-center ${dx > 0 ? 'justify-start pl-6' : 'justify-end pr-6'} ${SWIPE_META[meta].bg} text-white`}>
          <span className="flex items-center gap-2 text-[14px] font-semibold">{SWIPE_META[meta].icon}{Math.abs(dx) > THRESHOLD ? SWIPE_META[meta].label : ''}</span>
        </div>
      )}
      <div
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        style={{ transform: `translateX(${dx}px)`, transition: start.current ? 'none' : 'transform .18s ease-out' }}
        className="relative bg-bg"
      >
        <Link href={href} className="block px-4 pb-3 pt-3 active:bg-surface-1">
          <div className="flex gap-3">
            <div className="min-w-0 flex-1">
              {/* Source line */}
              <div className="mb-1 flex items-center gap-1.5 text-ink-3">
                {doc.isFeed && !doc.seen && <span className="-ml-3 mr-0.5 h-[7px] w-[7px] shrink-0 rounded-full bg-accent" />}
                {doc.domain && (doc.type === 'article' || doc.type === 'rss') ? <Favicon domain={doc.domain} /> : <TypeIcon type={doc.type} />}
                <span className="smallcaps truncate">{sourceLine}</span>
              </div>
              {/* Title + tag chips */}
              <h3 className="text-[17px] font-semibold leading-[22px] text-ink line-clamp-3">
                {doc.title}
                {doc.tags.map(t => (
                  <span key={t} className="ml-1.5 inline-block translate-y-[-2px] rounded bg-chip px-1.5 align-middle text-[12px] font-medium leading-5 text-ink-ui">{t}</span>
                ))}
              </h3>
              {/* Date · excerpt */}
              {(doc.excerpt || dateStr) && (
                <p className="mt-1 text-[14px] leading-5 text-ink-2 line-clamp-2">
                  <span className="text-ink-3">{dateStr}</span>{doc.excerpt && <span className="text-ink-3"> · </span>}{doc.excerpt}
                </p>
              )}
              {/* Author · time */}
              <p className="mt-1.5 truncate text-[14px] text-ink-2">
                {[doc.author || (doc.isFeed ? doc.feedTitle : null), time].filter(Boolean).join(' · ')}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); onMore(doc); }}
                aria-label="More"
                className="-mr-2 -mt-1 flex h-8 w-8 items-center justify-center text-ink-2"
              >
                <MoreHorizontal size={18} />
              </button>
              <Thumb doc={doc} />
            </div>
          </div>
          {doc.progress > 0.01 && (
            <div className="mt-2 h-[2px] w-full overflow-hidden rounded bg-surface-group">
              <div className="h-full bg-ink-2" style={{ width: `${Math.round(doc.progress * 100)}%` }} />
            </div>
          )}
        </Link>
      </div>
      <div className="h-[6px] bg-surface-1" />
    </div>
  );
}

export function Thumb({ doc, size = 84 }: { doc: DocumentSummary; size?: number }) {
  if (doc.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={doc.image} alt="" width={size} height={size} className="rounded-md object-cover" style={{ width: size, height: size }} loading="lazy" />;
  }
  return (
    <div className="flex items-center justify-center rounded-md bg-surface-group p-2 text-center" style={{ width: size, height: size }}>
      <span className="line-clamp-4 font-serif text-[11px] leading-tight text-ink-2">{doc.title}</span>
    </div>
  );
}

export function SeenIcon({ seen }: { seen: boolean }) {
  return seen ? <EyeOff size={18} /> : <Eye size={18} />;
}
