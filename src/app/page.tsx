'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Settings, ChevronRight } from 'lucide-react';
import TabBar from '@/components/app/TabBar';
import { Thumb } from '@/components/app/DocumentRow';
import type { DocumentSummary } from '@/lib/documents';
import { HOME_ROWS, type HomeRowDef } from '@/lib/home-rows';
import ReviewHero, { type ReviewSummary } from '@/components/app/ReviewHero';


export default function HomePage() {
  const [rows, setRows] = useState<HomeRowDef[]>(HOME_ROWS);
  const [review, setReview] = useState<ReviewSummary | null>(null);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(s => {
      if (s?.homeRows) {
        try {
          const ids: string[] = JSON.parse(s.homeRows);
          setRows(ids.map(id => HOME_ROWS.find(r => r.id === id)).filter(Boolean) as HomeRowDef[]);
        } catch {}
      }
    }).catch(() => {});
    fetch('/api/review/summary').then(r => r.json()).then(setReview).catch(() => {});
  }, []);

  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-32">
      <header className="px-4 pt-safe">
        <div className="flex h-12 items-center justify-end">
          <Link href="/settings" aria-label="Settings" className="-mr-2 flex h-10 w-10 items-center justify-center text-ink"><Settings size={22} strokeWidth={1.75} /></Link>
        </div>
        <h1 className="pb-3 pt-1 text-[28px] font-bold leading-8 text-ink">Home</h1>
      </header>

      <div className="px-4">
        <ReviewHero review={review} />
      </div>

      {rows.map(row => <HomeRow key={row.id} row={row} />)}

      <TabBar dueCount={review?.due ?? 0} />
    </div>
  );
}

function HomeRow({ row }: { row: HomeRowDef }) {
  const [items, setItems] = useState<DocumentSummary[] | null>(null);
  useEffect(() => {
    fetch(`/api/documents?${row.query}&limit=12`).then(r => r.json()).then(d => setItems(d.items ?? [])).catch(() => setItems([]));
  }, [row.query]);

  if (items && items.length === 0) return null;
  return (
    <section className="mb-7">
      <h2 className="mb-3 px-4 text-[17px] font-semibold text-ink">{row.title}</h2>
      <div className="no-scrollbar flex gap-4 overflow-x-auto px-4">
        {(items ?? Array.from({ length: 3 })).map((doc, i) => doc ? (
          <Link key={(doc as DocumentSummary).id} href={`/read/${(doc as DocumentSummary).id}?from=/`} className="w-[100px] shrink-0">
            <Thumb doc={doc as DocumentSummary} size={100} />
            <p className="mt-2 text-[15px] font-semibold leading-5 text-ink line-clamp-3">{(doc as DocumentSummary).title}</p>
            {(doc as DocumentSummary).author && <p className="mt-0.5 truncate text-[13px] text-ink-2">{(doc as DocumentSummary).author}</p>}
          </Link>
        ) : <div key={i} className="h-[100px] w-[100px] shrink-0 animate-pulse rounded-md bg-surface-group" />)}
      </div>
    </section>
  );
}
