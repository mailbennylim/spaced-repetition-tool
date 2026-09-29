'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, ChevronLeft, Plus, Minus, Check } from 'lucide-react';
import HighlightCard, { type BrowseHighlight } from '@/components/review/HighlightCard';

interface Review { id: string; interval: number; repetitions: number; highlight: BrowseHighlight & { source: { name: string } } }

const DEFAULT_INTERVAL = 30, MIN = 1, MAX = 365, STEP = 10;
// Public-domain paintings (Caspar David Friedrich, via Wikimedia Commons) for the finish screen.
const PAINTINGS = ['/finish/Wanderer_above_the_Sea_of_Fog.jpg', '/finish/The_Monk_by_the_Sea.jpg'];

/**
 * Daily Review session (docs/ux-spec.md §3.7.2). Keeps the app's own scheduling:
 * 10 cards, "next review in N days" (default 30, ±10 per tap, 1–365).
 */
export default function ReviewSessionPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [index, setIndex] = useState(0);
  const [intervals, setIntervals] = useState<Record<string, number>>({});
  const [done, setDone] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);
  const [dx, setDx] = useState(0);
  const touch = useRef<{ x: number; y: number; horizontal: boolean | null } | null>(null);

  useEffect(() => { fetch('/api/review').then(r => r.json()).then(setReviews).catch(() => setReviews([])); }, []);

  const current = reviews?.[index];
  const interval = current ? intervals[current.id] ?? DEFAULT_INTERVAL : DEFAULT_INTERVAL;
  const adjust = (dir: 'more' | 'less') => { if (!current) return; setIntervals(p => ({ ...p, [current.id]: dir === 'more' ? Math.max(MIN, interval - STEP) : Math.min(MAX, interval + STEP) })); };

  const submit = async () => {
    if (!current) return;
    fetch('/api/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reviewId: current.id, interval }) }).catch(() => {});
    setDone(d => new Set(d).add(current.id));
  };
  const next = async () => { await submit(); if (reviews && index >= reviews.length - 1) setFinished(true); else setIndex(i => i + 1); };
  const prev = () => setIndex(i => Math.max(0, i - 1));

  // Swipe the card: left → next, right → prev
  const onTouchStart = (e: React.TouchEvent) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY, horizontal: null }; };
  const onTouchMove = (e: React.TouchEvent) => { const s = touch.current; if (!s) return; const t = e.touches[0]; const ddx = t.clientX - s.x, ddy = t.clientY - s.y; if (s.horizontal === null) { if (Math.abs(ddx) < 8 && Math.abs(ddy) < 8) return; s.horizontal = Math.abs(ddx) > Math.abs(ddy); } if (s.horizontal) setDx(ddx); };
  const onTouchEnd = () => { const s = touch.current; touch.current = null; if (s?.horizontal) { if (dx < -90) next(); else if (dx > 90 && index > 0) prev(); } setDx(0); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'ArrowRight' || e.key === 'Enter') next(); if (e.key === 'ArrowLeft') prev(); if (e.key === '+' || e.key === '=') adjust('more'); if (e.key === '-') adjust('less'); if (e.key === 'Escape') router.push('/review'); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, interval, index]);

  if (reviews === null) return <div className="min-h-dvh bg-bg" />;

  if (finished || reviews.length === 0) {
    const painting = PAINTINGS[new Date().getDate() % PAINTINGS.length];
    return (
      <div className="relative flex min-h-dvh flex-col bg-[#161616] text-[#efebdf]">
        <div className="absolute inset-x-0 bottom-0 top-[35%] bg-cover bg-center" style={{ backgroundImage: `url(${painting})` }} />
        <div className="absolute inset-x-0 top-[35%] h-48 bg-gradient-to-b from-[#161616] to-transparent" />
        <header className="relative grid grid-cols-[48px_1fr_48px] items-center px-4 pt-[calc(var(--safe-top)+12px)]">
          <Link href="/review" aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fbf9f3] text-[#161616]"><X size={22} /></Link>
          <div className="text-center"><p className="text-[20px] font-semibold">Daily Review</p><div className="mt-1 flex justify-center gap-1.5">{reviews.map(r => <span key={r.id} className="h-1.5 w-1.5 rounded-full bg-[#efebdf]/40" />)}<Check size={12} /></div></div>
        </header>
        <div className="relative mt-16 px-8 text-center">
          <h1 className="text-[40px] font-bold">{reviews.length === 0 ? 'All caught up' : 'Great job!'}</h1>
          <p className="mt-3 text-[17px] leading-6 text-[#efebdf]/90">{reviews.length === 0 ? 'Nothing is due right now. Highlight something new or come back tomorrow.' : `You just reviewed ${done.size} highlight${done.size === 1 ? '' : 's'} and completed your Daily Review.`}</p>
        </div>
        <div className="relative mt-auto px-5 pb-[calc(var(--safe-bottom)+28px)]">
          <Link href="/" className="flex h-14 items-center justify-center rounded-full bg-[#161616] text-[18px] font-semibold">Done</Link>
          {reviews.length > 0 && <button onClick={() => { setFinished(false); setIndex(0); setDone(new Set()); setReviews(null); fetch('/api/review').then(r => r.json()).then(setReviews); }} className="mt-5 w-full text-center text-[18px] font-semibold">Review more highlights →</button>}
        </div>
      </div>
    );
  }

  const h = current!.highlight;
  const hint = interval < DEFAULT_INTERVAL ? 'showing more often' : interval > DEFAULT_INTERVAL ? 'showing less often' : 'default';
  const hintColor = interval < DEFAULT_INTERVAL ? 'text-emerald-400' : interval > DEFAULT_INTERVAL ? 'text-orange-400' : 'text-ink-2';

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col bg-bg">
      <header className="grid grid-cols-[48px_1fr_48px] items-center px-4 pt-[calc(var(--safe-top)+12px)]">
        <Link href="/review" aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fbf9f3] text-[#161616]"><X size={22} /></Link>
        <div className="text-center">
          <p className="text-[20px] font-semibold text-ink">Daily Review</p>
          <div className="mt-1 flex items-center justify-center gap-1.5">
            {reviews.map((r, i) => <span key={r.id} className={`h-1.5 w-1.5 rounded-full ${i === index ? 'bg-ink' : done.has(r.id) ? 'bg-accent' : 'bg-ink-3'}`} />)}
            <Check size={12} className="text-ink-3" />
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 pt-6" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <div style={{ transform: `translateX(${dx}px) rotate(${dx / 40}deg)`, transition: touch.current ? 'none' : 'transform .2s ease-out' }}>
          <HighlightCard key={h.id} highlight={h} onChange={u => setReviews(rs => rs?.map(r => (r.id === current!.id ? { ...r, highlight: { ...r.highlight, ...u } } : r)) ?? rs)} />
        </div>
      </div>

      <div className="px-4 pb-[calc(var(--safe-bottom)+20px)]">
        <div className="flex items-start justify-around">
          <RoundButton label="Prev" onClick={prev} disabled={index === 0}><ChevronLeft size={22} /></RoundButton>
          <RoundButton label="More often" onClick={() => adjust('more')} disabled={interval <= MIN}><Plus size={22} /></RoundButton>
          <RoundButton label="Less often" onClick={() => adjust('less')} disabled={interval >= MAX}><Minus size={22} /></RoundButton>
          <RoundButton label={index === reviews.length - 1 ? 'Finish' : 'Next'} onClick={next} primary><Check size={24} /></RoundButton>
        </div>
        <p className={`mt-3 text-center text-[13px] ${hintColor}`}>Next review in <b>{interval} day{interval === 1 ? '' : 's'}</b> · {hint}</p>
      </div>
    </div>
  );
}

function RoundButton({ label, onClick, disabled, primary, children }: { label: string; onClick: () => void; disabled?: boolean; primary?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} className="flex w-[72px] flex-col items-center gap-1.5 disabled:opacity-30">
      <span className={`flex h-[54px] w-[54px] items-center justify-center rounded-full ${primary ? 'bg-accent text-bg' : 'border-[1.5px] border-ink-2 text-ink'}`}>{children}</span>
      <span className="text-[11px] text-ink-2">{label}</span>
    </button>
  );
}
