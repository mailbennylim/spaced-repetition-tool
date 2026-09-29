'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ListHeader from '@/components/app/ListHeader';
import TabBar from '@/components/app/TabBar';
import HighlightCard, { type BrowseHighlight } from '@/components/review/HighlightCard';

/** One document's highlights as cards (docs/ux-spec.md §3.7.4), with "Open in reader". */
export default function DocumentHighlightsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const key = decodeURIComponent(id);
  const [items, setItems] = useState<BrowseHighlight[]>([]);
  useEffect(() => {
    const q = key.startsWith('t:') ? `title=${encodeURIComponent(key.slice(2))}` : `documentId=${key}`;
    fetch(`/api/highlights?${q}`).then(r => r.json()).then(setItems).catch(() => {});
  }, [key]);
  const title = items[0]?.document?.title ?? items[0]?.title ?? 'Highlights';
  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-28">
      <ListHeader title={title} onBack={() => router.push('/review/documents')} />
      <div className="px-4">
        {!key.startsWith('t:') && <Link href={`/read/${key}?from=/review/documents/${key}`} className="mb-4 inline-block rounded-full border border-surface-active px-4 py-2 text-[14px] font-medium text-ink">Open in reader</Link>}
        <div className="space-y-3">
          {items.map(h => <HighlightCard key={h.id} highlight={h} onChange={u => setItems(xs => xs.map(x => (x.id === u.id ? { ...x, ...u } : x)))} />)}
        </div>
      </div>
      <TabBar />
    </div>
  );
}
