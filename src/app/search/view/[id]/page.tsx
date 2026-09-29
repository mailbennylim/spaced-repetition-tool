'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ListHeader from '@/components/app/ListHeader';
import TabBar from '@/components/app/TabBar';
import DocumentRow from '@/components/app/DocumentRow';
import DocumentActionsSheet from '@/components/app/DocumentActionsSheet';
import type { DocumentSummary } from '@/lib/documents';

/** A saved filtered view's results (docs/ux-spec.md §3.8 / Appendix B). */
export default function SavedViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [view, setView] = useState<{ name: string; query: string } | null>(null);
  const [docs, setDocs] = useState<DocumentSummary[] | null>(null);
  const [error, setError] = useState('');
  const [active, setActive] = useState<DocumentSummary | null>(null);

  const load = async () => {
    const views = await fetch('/api/views').then(r => r.json());
    const v = views.find((x: { id: string }) => x.id === id);
    if (!v) { setError('View not found'); return; }
    setView(v);
    const res = await fetch(`/api/search?filter=${encodeURIComponent(v.query)}`);
    const data = await res.json();
    if (!res.ok) setError(data.error || 'Invalid query'); else setDocs(data.documents);
  };
  useEffect(() => { load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-28">
      <ListHeader title={view?.name ?? 'View'} onBack={() => router.push('/search')} />
      {view && <p className="mb-2 px-4 font-mono text-[12px] text-ink-2">{view.query}</p>}
      {error && <p className="px-4 py-8 text-center text-[14px] text-danger">{error}</p>}
      {docs && docs.length === 0 && <p className="px-4 py-10 text-center text-[14px] text-ink-2">No documents match this view.</p>}
      {docs?.map(doc => <DocumentRow key={doc.id} doc={doc} onMore={setActive} from={`/search/view/${id}`} />)}
      <TabBar />
      <DocumentActionsSheet doc={active} onClose={() => setActive(null)} onChanged={() => load()} />
    </div>
  );
}
