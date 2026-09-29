'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import ListHeader from '@/components/app/ListHeader';
import TabBar from '@/components/app/TabBar';
import { rowDate } from '@/lib/format';

interface Row { key: string; documentId: string | null; title: string; author: string | null; image: string | null; count: number; last: string }

/** Highlights by document (docs/ux-spec.md §3.7.4). */
export default function ByDocumentPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => { fetch('/api/highlights?group=document').then(r => r.json()).then(setRows).catch(() => {}); }, []);
  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-28">
      <ListHeader title="By document" onBack={() => router.push('/review')} />
      <div className="px-4">
        <div className="overflow-hidden rounded-group bg-surface-1">
          {rows.map(r => (
            <Link key={r.key} href={`/review/documents/${encodeURIComponent(r.documentId ?? r.key)}`} className="flex items-center gap-3 border-t border-bg px-4 py-3 first:border-t-0">
              {r.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.image} alt="" className="h-12 w-12 rounded object-cover" />
              ) : <span className="flex h-12 w-12 items-center justify-center rounded bg-surface-group font-serif text-[11px] text-ink-2">{r.title.slice(0, 2)}</span>}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-semibold text-ink">{r.title}</p>
                <p className="truncate text-[13px] text-ink-2">{[r.author, `${r.count} highlight${r.count === 1 ? '' : 's'}`, rowDate(r.last)].filter(Boolean).join(' · ')}</p>
              </div>
              <ChevronRight size={16} className="text-ink-2" />
            </Link>
          ))}
          {rows.length === 0 && <p className="px-4 py-8 text-center text-[14px] text-ink-2">No highlights yet.</p>}
        </div>
      </div>
      <TabBar />
    </div>
  );
}
