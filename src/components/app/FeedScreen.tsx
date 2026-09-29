'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Rss, Folder, FolderPlus, ArrowDownUp, ListChecks, Settings, ChevronRight, Search } from 'lucide-react';
import ListHeader from '@/components/app/ListHeader';
import DocumentList from '@/components/app/DocumentList';
import SegmentedPill from '@/components/ui/SegmentedPill';
import ContinueBar from '@/components/app/ContinueBar';
import TabBar from '@/components/app/TabBar';
import Drawer, { DrawerGroup } from '@/components/ui/Drawer';
import Sheet, { SheetGroup, SheetRow } from '@/components/ui/Sheet';
import SortSheet, { type SortState } from '@/components/app/SortSheet';
import FeedSearchSheet from '@/components/app/FeedSearchSheet';
import { useToast } from '@/components/ui/Toast';

export interface FeedInfo { id: string; title: string; iconUrl: string | null; folder: string | null; folderId: string | null; count: number; unseen: number; url: string; lastError: string | null }

interface Props { feedId?: string; folder?: string; title?: string }

const SORT_KEY = 'feed-sort';

/** Feed tab (docs/ux-spec.md §3.3): Unseen | Seen, unread dots, Browse drawer with folders + all feeds. */
export default function FeedScreen({ feedId, folder, title }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [seen, setSeen] = useState<'unseen' | 'seen'>('unseen');
  const [sort, setSort] = useState<SortState>({ sort: 'saved', order: 'desc' });
  const [browse, setBrowse] = useState(false);
  const [add, setAdd] = useState(false);
  const [search, setSearch] = useState(false);
  const [newFolder, setNewFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [actions, setActions] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [bulk, setBulk] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [feeds, setFeeds] = useState<FeedInfo[]>([]);
  const [find, setFind] = useState('');

  useEffect(() => { try { const s = localStorage.getItem(SORT_KEY); if (s) setSort(JSON.parse(s)); } catch {} }, []);
  const changeSort = (s: SortState) => { setSort(s); try { localStorage.setItem(SORT_KEY, JSON.stringify(s)); } catch {} };
  const loadFeeds = useCallback(() => fetch('/api/feeds').then(r => r.json()).then(setFeeds).catch(() => {}), []);
  useEffect(() => { loadFeeds(); }, [loadFeeds]);

  // Pull new items when the tab opens (background refresh also runs on the server).
  useEffect(() => { fetch('/api/feeds/refresh', { method: 'POST' }).then(r => r.json()).then(d => { if (d.added) { setReloadKey(k => k + 1); loadFeeds(); } }).catch(() => {}); }, [loadFeeds]);

  const params = new URLSearchParams({ scope: 'feed', seen: String(seen === 'seen'), sort: sort.sort, order: sort.order });
  if (feedId) params.set('feedId', feedId);
  if (folder) params.set('folder', folder);
  const query = params.toString();
  const from = feedId ? `/feed/source/${feedId}` : folder ? `/feed/folder/${encodeURIComponent(folder)}` : '/feed';

  const bulkAction = async (action: 'seen' | 'delete') => {
    setBulk(false); setActions(false);
    const res = await fetch(`/api/documents?${query}&limit=200`); const { items } = await res.json();
    const data = action === 'seen' ? { seen: true } : { trash: true };
    await Promise.all(items.map((d: { id: string }) => fetch(`/api/documents/${d.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })));
    setReloadKey(k => k + 1); loadFeeds();
    toast(`${items.length} item${items.length === 1 ? '' : 's'} ${action === 'seen' ? 'marked as seen' : 'moved to Trash'}`);
  };

  const createFolder = async () => {
    const name = folderName.trim(); if (!name) return;
    await fetch('/api/feeds/folders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    setNewFolder(false); setFolderName(''); setAdd(false); loadFeeds(); toast(`Folder “${name}” added`);
  };

  const folders = [...new Set(feeds.map(f => f.folder).filter(Boolean))] as string[];
  const shownFeeds = feeds.filter(f => f.title.toLowerCase().includes(find.toLowerCase()));

  return (
    <div className="mx-auto min-h-dvh max-w-2xl">
      <ListHeader
        title={title ?? (seen === 'unseen' ? 'Unseen' : 'Seen')}
        onBrowse={() => setBrowse(true)}
        onBack={feedId || folder ? () => router.push('/feed') : undefined}
        onAdd={() => setAdd(true)}
        onMore={() => setActions(true)}
      />
      <DocumentList
        key={query}
        query={query}
        reloadKey={reloadKey}
        from={from}
        swipeRight="save"
        swipeLeft="seen"
        emptyTitle={feeds.length === 0 ? 'No feeds yet' : seen === 'unseen' ? 'All caught up' : 'Nothing seen yet'}
        emptyText={feeds.length === 0 ? 'Tap ⊕ to subscribe to an RSS feed, or subscribe to newsletters with your Feed email address in Settings.' : undefined}
      />

      <SegmentedPill floating value={seen} onChange={setSeen} options={[{ value: 'unseen', label: 'Unseen' }, { value: 'seen', label: 'Seen' }]} />
      <ContinueBar />
      <TabBar />

      {/* ☰ Browse (feeds) */}
      <Drawer open={browse} onClose={() => setBrowse(false)}>
        <DrawerGroup>
          <Link href="/feed" onClick={() => setBrowse(false)} className="flex h-12 items-center gap-3 px-4 text-[16px] text-ink"><Rss size={18} className="text-[#f28c28]" /><span className="flex-1">Feed</span><ChevronRight size={16} className="text-ink-2" /></Link>
        </DrawerGroup>
        {folders.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2 text-[15px] font-semibold text-ink">Folders</h3>
            <DrawerGroup>
              {folders.map(name => (
                <Link key={name} href={`/feed/folder/${encodeURIComponent(name)}`} onClick={() => setBrowse(false)} className="flex h-12 items-center gap-3 border-t border-surface-1 px-4 text-[16px] text-ink first:border-t-0"><Folder size={18} className="text-ink-2" /><span className="flex-1 truncate">{name}</span><ChevronRight size={16} className="text-ink-2" /></Link>
              ))}
            </DrawerGroup>
          </div>
        )}
        <h3 className="mb-2 mt-5 text-[15px] font-semibold text-ink">All feeds</h3>
        <div className="mb-3 flex h-10 items-center gap-2 rounded-group bg-surface-group px-3">
          <Search size={16} className="text-ink-2" />
          <input value={find} onChange={e => setFind(e.target.value)} placeholder="Find feed" className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink-2 focus:outline-none" />
        </div>
        <DrawerGroup>
          {shownFeeds.length === 0 && <p className="px-4 py-3 text-[14px] text-ink-2">No feeds yet</p>}
          {shownFeeds.map(f => (
            <Link key={f.id} href={`/feed/source/${f.id}`} onClick={() => setBrowse(false)} className="flex h-12 items-center gap-3 border-t border-surface-1 px-4 text-[16px] text-ink first:border-t-0">
              {f.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.iconUrl} alt="" className="h-5 w-5 rounded-sm object-cover" />
              ) : <span className="h-5 w-5 rounded-sm border border-surface-active" />}
              <span className="flex-1 truncate">{f.title}</span>
              <ChevronRight size={16} className="text-ink-2" />
            </Link>
          ))}
        </DrawerGroup>
      </Drawer>

      {/* ⊕ Add */}
      <Sheet open={add && !search && !newFolder} onClose={() => setAdd(false)} title="Add">
        <SheetGroup>
          <SheetRow label="Subscribe to RSS feed" icon={<Rss size={18} />} onClick={() => setSearch(true)} />
          <SheetRow label="Add new folder" icon={<FolderPlus size={18} />} onClick={() => setNewFolder(true)} />
        </SheetGroup>
      </Sheet>
      <FeedSearchSheet open={search} onClose={() => { setSearch(false); setAdd(false); }} onSubscribed={() => { loadFeeds(); setReloadKey(k => k + 1); }} />
      <Sheet open={newFolder} onClose={() => setNewFolder(false)} title="New folder" left={<button onClick={() => setNewFolder(false)}>Cancel</button>} right={<button onClick={createFolder} className="font-medium text-accent">Add</button>}>
        <input autoFocus value={folderName} onChange={e => setFolderName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') createFolder(); }} placeholder="Folder name" className="h-11 w-full rounded-group bg-surface-group px-3 text-[16px] text-ink placeholder:text-ink-2 focus:outline-none" />
      </Sheet>

      {/* ⋯ Feed actions */}
      <Sheet open={actions && !sortOpen && !bulk} onClose={() => setActions(false)} title="Feed actions">
        <SheetGroup>
          <SheetRow label="Manage feeds" icon={<Rss size={18} />} onClick={() => { setActions(false); router.push('/feed/manage'); }} />
        </SheetGroup>
        <SheetGroup>
          <SheetRow label="Sort documents" icon={<ArrowDownUp size={18} />} onClick={() => setSortOpen(true)} />
          <SheetRow label="Bulk actions" icon={<ListChecks size={18} />} onClick={() => setBulk(true)} />
        </SheetGroup>
        <SheetGroup>
          <SheetRow label="Settings" icon={<Settings size={18} />} onClick={() => { setActions(false); router.push('/settings'); }} />
        </SheetGroup>
      </Sheet>
      <SortSheet open={sortOpen} onClose={() => { setSortOpen(false); setActions(false); }} value={sort} onChange={changeSort} />
      <Sheet open={bulk} onClose={() => { setBulk(false); setActions(false); }} title="Bulk actions">
        <p className="mb-3 px-1 text-[13px] text-ink-2">Applies to every item in this list.</p>
        <SheetGroup>{seen === 'unseen' && <SheetRow label="Mark all as seen" onClick={() => bulkAction('seen')} />}</SheetGroup>
        <SheetGroup><SheetRow label="Delete all" danger onClick={() => bulkAction('delete')} /></SheetGroup>
      </Sheet>
    </div>
  );
}
