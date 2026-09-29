'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ListHeader from '@/components/app/ListHeader';
import TabBar from '@/components/app/TabBar';
import HighlightCard, { type BrowseHighlight } from '@/components/review/HighlightCard';
import { HIGHLIGHT_COLORS } from '@/lib/colors';

export default function ColorHighlightsPage() {
  const { color } = useParams<{ color: string }>();
  const router = useRouter();
  const [items, setItems] = useState<BrowseHighlight[]>([]);
  useEffect(() => { fetch(`/api/highlights?color=${color}`).then(r => r.json()).then(setItems).catch(() => {}); }, [color]);
  const label = HIGHLIGHT_COLORS.find(c => c.id === color)?.label ?? color;
  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-28">
      <ListHeader title={label} onBack={() => router.push('/review/colors')} />
      <div className="space-y-3 px-4">
        {items.map(h => <HighlightCard key={h.id} highlight={h} onChange={u => setItems(xs => xs.map(x => (x.id === u.id ? { ...x, ...u } : x)))} />)}
        {items.length === 0 && <p className="py-8 text-center text-[14px] text-ink-2">No {label.toLowerCase()} highlights yet.</p>}
      </div>
      <TabBar />
    </div>
  );
}
