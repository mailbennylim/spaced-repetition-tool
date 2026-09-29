'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, Trash2 } from 'lucide-react';
import ListHeader from '@/components/app/ListHeader';
import TabBar from '@/components/app/TabBar';
import { Thumb } from '@/components/app/DocumentRow';
import { useToast } from '@/components/ui/Toast';
import { rowDate } from '@/lib/format';
import type { DocumentSummary } from '@/lib/documents';

/** Trash (docs/ux-spec.md §3.2 Browse → Trash): restore per row, "Restore all" and "Empty" at the bottom. */
export default function TrashPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<DocumentSummary[]>([]);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  const load = () => fetch('/api/documents?scope=trash&limit=200').then(r => r.json()).then(d => setItems(d.items)).catch(() => {});
  useEffect(() => { load(); }, []);

  const restore = async (doc: DocumentSummary) => {
    await fetch(`/api/documents/${doc.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trash: false }) });
    setItems(prev => prev.filter(d => d.id !== doc.id));
    toast('Restored');
  };
  const restoreAll = async () => { await Promise.all(items.map(restore)); };
  const empty = async () => {
    setConfirmEmpty(false);
    await Promise.all(items.map(d => fetch(`/api/documents/${d.id}`, { method: 'DELETE' })));
    setItems([]); toast('Trash emptied');
  };

  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-40">
      <ListHeader title="Trash" onBack={() => router.back()} />
      {items.length === 0 ? (
        <p className="px-8 py-20 text-center text-[15px] text-ink-2">You have no documents in your trash.</p>
      ) : (
        <>
          {items.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 border-b-[6px] border-surface-1 px-4 py-3">
              <Thumb doc={doc} size={56} />
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-semibold leading-5 text-ink line-clamp-2">{doc.title}</p>
                <p className="mt-1 text-[13px] text-ink-2">Deleted {doc.deletedAt ? rowDate(doc.deletedAt) : ''}</p>
              </div>
              <button onClick={() => restore(doc)} aria-label="Restore document" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-group text-ink"><RotateCcw size={18} /></button>
            </div>
          ))}
          <div className="fixed inset-x-0 z-30 mx-auto flex max-w-2xl justify-between px-4" style={{ bottom: 'calc(var(--tabbar-h) + var(--safe-bottom) + 16px)' }}>
            <button onClick={restoreAll} className="rounded-full bg-surface-1 px-4 py-2.5 text-[14px] font-medium text-ink shadow-pop">Restore all</button>
            {confirmEmpty
              ? <button onClick={empty} className="rounded-full bg-danger px-4 py-2.5 text-[14px] font-semibold text-white shadow-pop">Delete {items.length} forever</button>
              : <button onClick={() => setConfirmEmpty(true)} className="flex items-center gap-2 rounded-full bg-surface-1 px-4 py-2.5 text-[14px] font-medium text-danger shadow-pop"><Trash2 size={16} /> Empty trash</button>}
          </div>
        </>
      )}
      <TabBar />
    </div>
  );
}
