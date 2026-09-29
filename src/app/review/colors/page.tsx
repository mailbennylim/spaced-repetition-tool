'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import ListHeader from '@/components/app/ListHeader';
import TabBar from '@/components/app/TabBar';
import { HIGHLIGHT_COLORS, colorSolid } from '@/lib/colors';

/** Highlights by colour (docs/ux-spec.md §3.7.4): five rows with counts. */
export default function ByColorPage() {
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => { fetch('/api/highlights?group=color').then(r => r.json()).then((rows: { color: string; count: number }[]) => setCounts(Object.fromEntries(rows.map(r => [r.color, r.count])))).catch(() => {}); }, []);
  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-28">
      <ListHeader title="By colour" onBack={() => router.push('/review')} />
      <div className="px-4">
        <div className="overflow-hidden rounded-group bg-surface-1">
          {HIGHLIGHT_COLORS.map(c => (
            <Link key={c.id} href={`/review/colors/${c.id}`} className="flex h-14 items-center gap-3 border-t border-bg px-4 first:border-t-0">
              <span className="h-6 w-6 rounded-full" style={{ background: colorSolid(c.id) }} />
              <span className="flex-1 text-[16px] text-ink">{c.label}</span>
              <span className="text-[14px] text-ink-2">{counts[c.id] ?? 0}</span>
              <ChevronRight size={16} className="text-ink-2" />
            </Link>
          ))}
        </div>
      </div>
      <TabBar />
    </div>
  );
}
