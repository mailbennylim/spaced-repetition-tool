'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DocumentSummary } from '@/lib/documents';
import DocumentRow, { type SwipeAction } from '@/components/app/DocumentRow';
import DocumentActionsSheet from '@/components/app/DocumentActionsSheet';
import { useToast } from '@/components/ui/Toast';

interface Props {
  /** Query string for /api/documents, e.g. "scope=library&location=inbox". */
  query: string;
  swipeRight?: SwipeAction;
  swipeLeft?: SwipeAction;
  from?: string;
  emptyTitle?: string;
  emptyText?: string;
  /** Bumps to force a reload (after adding a document). */
  reloadKey?: number;
  /** Extra space at the bottom so the floating pill / continue bar don't cover the last row. */
  bottomPad?: number;
}

export default function DocumentList({ query, swipeRight, swipeLeft, from, emptyTitle = 'Nothing here', emptyText, reloadKey = 0, bottomPad = 200 }: Props) {
  const { toast } = useToast();
  const [items, setItems] = useState<DocumentSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<DocumentSummary | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const loadingMore = useRef(false);

  const load = useCallback(async (offset = 0) => {
    const res = await fetch(`/api/documents?${query}&offset=${offset}&limit=60`);
    const data = await res.json();
    setTotal(data.total);
    setItems(prev => offset ? [...prev, ...data.items] : data.items);
  }, [query]);

  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load, reloadKey]);

  // Infinite scroll
  useEffect(() => {
    const el = sentinel.current; if (!el) return;
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting || loadingMore.current || items.length >= total) return;
      loadingMore.current = true;
      await load(items.length);
      loadingMore.current = false;
    }, { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, [items.length, total, load]);

  const patch = async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/documents/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.ok ? (await res.json()) as DocumentSummary : null;
  };

  const remove = (id: string) => setItems(prev => prev.filter(d => d.id !== id));
  const replace = (doc: DocumentSummary) => setItems(prev => prev.map(d => (d.id === doc.id ? doc : d)));
  const restore = (doc: DocumentSummary) => setItems(prev => (prev.some(d => d.id === doc.id) ? prev : [doc, ...prev]));

  const onSwipe = async (doc: DocumentSummary, action: SwipeAction) => {
    if (action === 'seen') {
      const updated = await patch(doc.id, { seen: !doc.seen });
      if (updated) replace(updated);
      return;
    }
    remove(doc.id);
    if (action === 'archive' || action === 'inbox') {
      const location = action === 'archive' ? 'archive' : 'inbox';
      await patch(doc.id, { location });
      toast(action === 'archive' ? 'Archived' : 'Moved to Inbox', { actionLabel: 'Undo', onAction: async () => { const u = await patch(doc.id, { location: doc.location }); if (u) restore(u); } });
    } else if (action === 'delete') {
      await patch(doc.id, { trash: true });
      toast('Moved to Trash', { actionLabel: 'Undo', onAction: async () => { const u = await patch(doc.id, { trash: false }); if (u) restore(u); } });
    } else if (action === 'save') {
      await patch(doc.id, { saveToLibrary: true });
      toast('Saved to Inbox', { actionLabel: 'Undo', onAction: async () => { const u = await patch(doc.id, { isFeed: true }); if (u) restore(u); } });
    }
  };

  const onChanged = (doc: DocumentSummary | null, action: string) => {
    if (!doc) return;
    // A document that no longer belongs in this list leaves it.
    const stillHere = query.includes('scope=trash') ? !!doc.deletedAt
      : !doc.deletedAt && (query.includes('scope=feed') ? doc.isFeed : !doc.isFeed) && (!/location=inbox/.test(query) || doc.location === 'inbox') && (!/location=archive/.test(query) || doc.location === 'archive') && (!/seen=false/.test(query) || !doc.seen) && (!/seen=true/.test(query) || doc.seen);
    if (stillHere) { if (action === 'undo') restore(doc); else replace(doc); } else remove(doc.id);
  };

  if (loading) return <div className="px-4 py-16 text-center text-[14px] text-ink-2">Loading…</div>;
  if (items.length === 0) {
    return (
      <div className="px-8 py-20 text-center">
        <p className="text-[17px] font-semibold text-ink">{emptyTitle}</p>
        {emptyText && <p className="mt-1 text-[14px] text-ink-2">{emptyText}</p>}
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: bottomPad }}>
      {items.map(doc => (
        <DocumentRow key={doc.id} doc={doc} onMore={setActive} swipeRight={swipeRight} swipeLeft={swipeLeft} onSwipe={onSwipe} from={from} />
      ))}
      <div ref={sentinel} />
      <DocumentActionsSheet doc={active} onClose={() => setActive(null)} onChanged={onChanged} />
    </div>
  );
}
