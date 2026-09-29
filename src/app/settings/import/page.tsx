'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ListHeader from '@/components/app/ListHeader';
import TabBar from '@/components/app/TabBar';
import type { ImportStatus } from '@/lib/readwise-import';

/** Import from Readwise (docs/ux-spec.md §3.9): one button, live progress. */
export default function ImportPage() {
  const router = useRouter();
  const [st, setSt] = useState<(ImportStatus & { configured: boolean }) | null>(null);

  const load = () => fetch('/api/import/readwise').then(r => r.json()).then(setSt).catch(() => {});
  useEffect(() => { load(); }, []);
  useEffect(() => { if (!st?.running) return; const t = setInterval(load, 1500); return () => clearInterval(t); }, [st?.running]);

  const start = async () => { const d = await fetch('/api/import/readwise', { method: 'POST' }).then(r => r.json()); setSt(s => ({ ...(s as ImportStatus & { configured: boolean }), ...d })); };

  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-28">
      <ListHeader title="Import from Readwise" onBack={() => router.back()} />
      <div className="px-4">
        <p className="mb-4 text-[15px] leading-6 text-ink-2">
          Brings over your Reader documents (articles, emails and RSS items with their text, location and tags), every Reader highlight in its colour, and your other Readwise highlights (Kindle, books). Books and PDFs uploaded to Reader can&apos;t be downloaded through the API, so only their highlights come across. Running it again only adds what&apos;s new.
        </p>
        {st && !st.configured && (
          <div className="mb-4 rounded-group bg-surface-group p-4 text-[14px] leading-6 text-ink">
            Add your Readwise access token to <code className="rounded bg-bg px-1">.env</code> as <code className="rounded bg-bg px-1">READWISE_ACCESS_TOKEN</code> (from readwise.io/access_token), then restart the app.
          </div>
        )}
        <button onClick={start} disabled={!st?.configured || st?.running} className="h-12 w-full rounded-full bg-accent text-[16px] font-semibold text-bg disabled:opacity-50">
          {st?.running ? 'Importing…' : st?.finishedAt ? 'Import again' : 'Start import'}
        </button>
        {st && (st.running || st.finishedAt) && (
          <div className="mt-5 rounded-group bg-surface-1 p-4 text-[14px] text-ink">
            <p className="mb-2 font-semibold">{st.phase}</p>
            <p className="text-ink-2">{st.documents} documents · {st.highlights} highlights · {st.skipped} already imported</p>
            {st.error && <p className="mt-2 text-danger">{st.error}</p>}
          </div>
        )}
      </div>
      <TabBar />
    </div>
  );
}
