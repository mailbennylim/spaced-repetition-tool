'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Palette, ChevronRight } from 'lucide-react';
import TabBar from '@/components/app/TabBar';
import ReviewHero, { type ReviewSummary } from '@/components/app/ReviewHero';
import HighlightCard, { type BrowseHighlight } from '@/components/review/HighlightCard';

/** Review tab landing (docs/ux-spec.md §3.7.1). */
export default function ReviewPage() {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [docs, setDocs] = useState<number | null>(null);
  const [recent, setRecent] = useState<BrowseHighlight[]>([]);

  useEffect(() => {
    fetch('/api/review/summary').then(r => r.json()).then(setSummary).catch(() => {});
    fetch('/api/highlights?group=document').then(r => r.json()).then(d => setDocs(d.length)).catch(() => {});
    fetch('/api/highlights?limit=8').then(r => r.json()).then(setRecent).catch(() => {});
  }, []);

  const Row = ({ href, icon, label, count }: { href: string; icon: React.ReactNode; label: string; count?: string }) => (
    <Link href={href} className="flex h-[46px] items-center gap-3 border-t border-bg px-4 first:border-t-0">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">{icon}</span>
      <span className="flex-1 text-[16px] text-ink">{label}</span>
      {count && <span className="text-[14px] text-[#478cd0]">{count}</span>}
      <ChevronRight size={16} className="text-ink-2" />
    </Link>
  );

  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-28">
      <header className="px-4 pt-safe">
        <div className="h-12" />
        <h1 className="pb-3 pt-1 text-[28px] font-bold leading-8 text-ink">Review</h1>
      </header>
      <div className="px-4">
        <ReviewHero review={summary} large />

        <h2 className="mb-3 mt-6 font-serif text-[22px] font-semibold text-ink">Browse Highlights</h2>
        <div className="overflow-hidden rounded-group bg-surface-1">
          <Row href="/review/documents" icon={<BookOpen size={16} />} label="By document" count={docs === null ? '' : `${docs} document${docs === 1 ? '' : 's'}`} />
          <Row href="/review/colors" icon={<Palette size={16} />} label="By colour" />
        </div>

        {recent.length > 0 && (
          <>
            <h2 className="mb-3 mt-7 font-serif text-[22px] font-semibold text-ink">Recently highlighted</h2>
            <div className="space-y-3">
              {recent.map(h => <HighlightCard key={h.id} highlight={h} compact />)}
            </div>
          </>
        )}
      </div>
      <TabBar dueCount={summary?.due ?? 0} />
    </div>
  );
}
