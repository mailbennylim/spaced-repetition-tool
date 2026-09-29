'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ListHeader from '@/components/app/ListHeader';
import TabBar from '@/components/app/TabBar';
import Sheet, { SheetGroup, SheetRow } from '@/components/ui/Sheet';
import FeedSearchSheet from '@/components/app/FeedSearchSheet';
import { useToast } from '@/components/ui/Toast';
import type { FeedInfo } from '@/components/app/FeedScreen';

interface FolderInfo { id: string; name: string; feeds: number }

/** Manage feeds (docs/ux-spec.md §3.3): list with icon, name, counts, last updated; tap → rename / folder / unsubscribe. */
export default function ManageFeedsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [feeds, setFeeds] = useState<(FeedInfo & { lastItemAt: string | null })[]>([]);
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [active, setActive] = useState<(FeedInfo & { lastItemAt: string | null }) | null>(null);
  const [mode, setMode] = useState<'menu' | 'rename' | 'folder' | null>(null);
  const [name, setName] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = () => Promise.all([fetch('/api/feeds').then(r => r.json()), fetch('/api/feeds/folders').then(r => r.json())]).then(([f, fo]) => { setFeeds(f); setFolders(fo); }).catch(() => {});
  useEffect(() => { load(); }, []);

  const patch = async (data: Record<string, unknown>) => { if (!active) return; await fetch(`/api/feeds/${active.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); setMode(null); setActive(null); load(); };
  const unsubscribe = async () => { if (!active) return; await fetch(`/api/feeds/${active.id}`, { method: 'DELETE' }); toast(`Unsubscribed from ${active.title}`); setMode(null); setActive(null); load(); };
  const refreshAll = async () => { setRefreshing(true); const d = await fetch('/api/feeds/refresh', { method: 'POST' }).then(r => r.json()); setRefreshing(false); load(); toast(d.added ? `${d.added} new item${d.added === 1 ? '' : 's'}` : 'No new items'); };

  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-28">
      <ListHeader title="Feeds" onBack={() => router.back()} onAdd={() => setAddOpen(true)} />
      <div className="px-4">
        <button onClick={refreshAll} disabled={refreshing} className="mb-3 flex items-center gap-2 text-[14px] text-accent disabled:opacity-50"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Checking for new items…' : 'Check for new items'}</button>
        <div className="overflow-hidden rounded-group bg-surface-1">
          {feeds.length === 0 && <p className="px-4 py-6 text-center text-[14px] text-ink-2">No feeds yet. Tap ⊕ to subscribe.</p>}
          {feeds.map(f => (
            <button key={f.id} onClick={() => { setActive(f); setName(f.title); setMode('menu'); }} className="flex w-full items-center gap-3 border-t border-bg px-4 py-3 text-left first:border-t-0">
              {f.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.iconUrl} alt="" className="h-8 w-8 rounded-md object-cover" />
              ) : <span className="h-8 w-8 rounded-md bg-surface-group" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] text-ink">{f.title}</p>
                <p className="truncate text-[12px] text-ink-2">{[f.folder, `${f.count} item${f.count === 1 ? '' : 's'}`, f.unseen ? `${f.unseen} unseen` : null, f.lastItemAt ? `updated ${formatDistanceToNow(new Date(f.lastItemAt), { addSuffix: true })}` : null].filter(Boolean).join(' · ')}</p>
                {f.lastError && <p className="truncate text-[12px] text-danger">{f.lastError}</p>}
              </div>
              <ChevronRight size={16} className="text-ink-2" />
            </button>
          ))}
        </div>
      </div>
      <TabBar />

      <Sheet open={mode === 'menu'} onClose={() => setMode(null)} title={active?.title}>
        <SheetGroup>
          <SheetRow label="Rename" onClick={() => setMode('rename')} />
          <SheetRow label={active?.folder ? `Folder: ${active.folder}` : 'Move to folder'} onClick={() => setMode('folder')} />
          <SheetRow label="Check for new items" onClick={() => patch({ refresh: true })} />
        </SheetGroup>
        <SheetGroup><SheetRow label="Unsubscribe" danger onClick={unsubscribe} /></SheetGroup>
      </Sheet>
      <Sheet open={mode === 'rename'} onClose={() => setMode('menu')} title="Rename feed" left={<button onClick={() => setMode('menu')}>Cancel</button>} right={<button onClick={() => patch({ title: name })} className="font-medium text-accent">Save</button>}>
        <input autoFocus value={name} onChange={e => setName(e.target.value)} className="h-11 w-full rounded-group bg-surface-group px-3 text-[16px] text-ink focus:outline-none" />
      </Sheet>
      <Sheet open={mode === 'folder'} onClose={() => setMode('menu')} title="Move to folder">
        <SheetGroup>
          <SheetRow label="No folder" onClick={() => patch({ folderId: null })} />
          {folders.map(fo => <SheetRow key={fo.id} label={fo.name} onClick={() => patch({ folderId: fo.id })} />)}
        </SheetGroup>
      </Sheet>
      <FeedSearchSheet open={addOpen} onClose={() => setAddOpen(false)} onSubscribed={load} />
    </div>
  );
}
