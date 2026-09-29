'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Trash2, Tag, MessageSquare, Archive, BookOpen } from 'lucide-react';
import NotesAndTagsSheet from '@/components/app/NotesAndTagsSheet';
import type { DocumentSummary } from '@/lib/documents';

/**
 * "Saved to Inbox" screen (docs/ux-spec.md §3.10 / §3.11): the target for the Android share sheet
 * and the bookmarklet. Saves the shared URL, then offers Read now · Delete · Tags · Note · Archive.
 */
export default function SavePage() {
  return <Suspense fallback={<div className="min-h-dvh bg-surface-sheet" />}><SaveInner /></Suspense>;
}

function SaveInner() {
  const sp = useSearchParams();
  const [doc, setDoc] = useState<DocumentSummary | null>(null);
  const [error, setError] = useState('');
  const [existed, setExisted] = useState(false);
  const [notes, setNotes] = useState<'note' | 'tags' | null>(null);
  const [gone, setGone] = useState(false);

  // Android often puts the link in "text" rather than "url".
  const raw = sp.get('url') || sp.get('text') || '';
  const url = raw.match(/https?:\/\/\S+/)?.[0] ?? raw;
  const title = sp.get('title') || '';

  useEffect(() => {
    if (!url) { setError('Nothing to save'); return; }
    fetch('/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, savedUsing: sp.get('via') === 'bookmarklet' ? 'bookmarklet' : 'share' }) })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Failed to save'); setDoc(d); setExisted(!!d.existed); })
      .catch(e => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const patch = async (data: Record<string, unknown>) => {
    if (!doc) return;
    const res = await fetch(`/api/documents/${doc.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (res.ok) setDoc(await res.json());
  };
  const close = () => { if (window.opener || history.length <= 1) window.close(); window.location.href = '/library'; };
  const del = async () => { if (!doc) return; await fetch(`/api/documents/${doc.id}`, { method: 'DELETE' }); setGone(true); setTimeout(close, 900); };

  const Round = ({ label, icon, onClick, active }: { label: string; icon: React.ReactNode; onClick: () => void; active?: boolean }) => (
    <button onClick={onClick} aria-label={label} className={`flex h-12 w-12 items-center justify-center rounded-full ${active ? 'bg-accent text-bg ring-2 ring-accent ring-offset-2 ring-offset-surface-sheet' : 'bg-surface-group text-ink'}`}>{icon}</button>
  );

  return (
    <div className="relative flex min-h-dvh flex-col items-center bg-surface-sheet px-6 pb-[calc(var(--safe-bottom)+24px)] pt-[calc(var(--safe-top)+16px)]" onClick={e => { if (e.target === e.currentTarget && doc) close(); }}>
      <button onClick={close} aria-label="Close" className="absolute right-4 top-[calc(var(--safe-top)+12px)] flex h-8 w-8 items-center justify-center rounded-full bg-surface-group text-ink"><X size={16} /></button>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-bg shadow-pop"><BookOpen size={36} className="text-accent" /></div>
        {error ? <p className="text-[18px] text-danger">{error}</p> : gone ? <p className="text-[20px] font-semibold text-ink">Deleted</p> : !doc ? <p className="text-[20px] font-semibold text-ink">Saving…</p> : (
          <>
            <p className="text-[20px] font-semibold text-ink">{existed ? 'Already in your library' : 'Saved to Inbox'}</p>
            <p className="mt-1 text-[13px] text-ink-2">{doc.location === 'archive' ? 'Moved to Archive' : title || doc.title}</p>
          </>
        )}
      </div>

      {doc && !gone && (
        <div className="w-full max-w-sm">
          <a href={`/read/${doc.id}?from=/library`} className="flex h-12 w-full items-center justify-center rounded-full bg-surface-group text-[16px] font-medium text-ink">Read now</a>
          <p className="mt-2 text-center text-[12px] text-ink-2">Tap anywhere to dismiss</p>
          <div className="mt-6 flex justify-center gap-4">
            <Round label="Delete" icon={<Trash2 size={20} />} onClick={del} />
            <Round label="Add tags" icon={<Tag size={20} />} onClick={() => setNotes('tags')} active={doc.tags.length > 0} />
            <Round label="Add a document note" icon={<MessageSquare size={20} />} onClick={() => setNotes('note')} active={!!doc.note} />
            <Round label={doc.location === 'archive' ? 'Move to Inbox' : 'Archive'} icon={<Archive size={20} />} onClick={() => patch({ location: doc.location === 'archive' ? 'inbox' : 'archive' })} active={doc.location === 'archive'} />
          </div>
        </div>
      )}

      {doc && <NotesAndTagsSheet open={!!notes} initialTab={notes ?? 'note'} onClose={() => setNotes(null)} note={doc.note ?? ''} tags={doc.tags} onSave={v => patch({ note: v.note, tags: v.tags })} />}
    </div>
  );
}
