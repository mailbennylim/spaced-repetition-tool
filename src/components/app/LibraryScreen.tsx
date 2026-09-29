'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, ArrowDownUp, ListChecks, Settings } from 'lucide-react';
import ListHeader from '@/components/app/ListHeader';
import DocumentList from '@/components/app/DocumentList';
import SegmentedPill from '@/components/ui/SegmentedPill';
import ContinueBar from '@/components/app/ContinueBar';
import TabBar from '@/components/app/TabBar';
import AddDocumentSheet from '@/components/app/AddDocumentSheet';
import LibraryBrowseDrawer from '@/components/app/LibraryBrowseDrawer';
import SortSheet, { type SortState } from '@/components/app/SortSheet';
import Sheet, { SheetGroup, SheetRow } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';

type Location = 'inbox' | 'archive';

interface Props {
  /** Fixed filter for type / tag views. */
  filter?: { type?: string; tag?: string };
  title?: string;
  /** Show ‹ back instead of ☰ (type and tag views). */
  back?: boolean;
}

const SORT_KEY = 'library-sort';

/** Library tab (docs/ux-spec.md §3.2), also used for type and tag lists. */
export default function LibraryScreen({ filter, title, back }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [location, setLocation] = useState<Location>('inbox');
  const [sort, setSort] = useState<SortState>({ sort: 'saved', order: 'desc' });
  const [browse, setBrowse] = useState(false);
  const [add, setAdd] = useState(false);
  const [actions, setActions] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [bulk, setBulk] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => { try { const s = localStorage.getItem(SORT_KEY); if (s) setSort(JSON.parse(s)); } catch {} }, []);
  const changeSort = (s: SortState) => { setSort(s); try { localStorage.setItem(SORT_KEY, JSON.stringify(s)); } catch {} };

  const params = new URLSearchParams({ scope: 'library', location, sort: sort.sort, order: sort.order });
  if (filter?.type) params.set('type', filter.type);
  if (filter?.tag) params.set('tag', filter.tag);
  const query = params.toString();
  const screenTitle = title ?? (location === 'inbox' ? 'Inbox' : 'Archive');
  const from = filter?.type ? `/library/type/${filter.type}` : filter?.tag ? `/library/tag/${encodeURIComponent(filter.tag)}` : '/library';

  const bulkAction = async (action: 'archive' | 'inbox' | 'delete') => {
    setBulk(false); setActions(false);
    const res = await fetch(`/api/documents?${query}&limit=200`);
    const { items } = await res.json();
    const data = action === 'delete' ? { trash: true } : { location: action };
    await Promise.all(items.map((d: { id: string }) => fetch(`/api/documents/${d.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })));
    setReloadKey(k => k + 1);
    toast(`${items.length} document${items.length === 1 ? '' : 's'} ${action === 'delete' ? 'moved to Trash' : action === 'archive' ? 'archived' : 'moved to Inbox'}`);
  };

  return (
    <div className="mx-auto min-h-dvh max-w-2xl">
      <ListHeader
        title={screenTitle}
        onBrowse={() => setBrowse(true)}
        onBack={back ? () => router.push('/library') : undefined}
        onAdd={() => setAdd(true)}
        onMore={() => setActions(true)}
      />
      <DocumentList
        key={query}
        query={query}
        reloadKey={reloadKey}
        from={from}
        swipeRight={location === 'inbox' ? 'archive' : 'inbox'}
        swipeLeft="delete"
        emptyTitle={location === 'inbox' ? 'Your Inbox is empty' : 'Nothing archived yet'}
        emptyText={location === 'inbox' ? 'Tap ⊕ to add a link or upload a file.' : undefined}
      />

      <SegmentedPill floating value={location} onChange={setLocation} options={[{ value: 'inbox', label: 'Inbox' }, { value: 'archive', label: 'Archive' }]} />
      <ContinueBar />
      <TabBar />

      <LibraryBrowseDrawer open={browse} onClose={() => setBrowse(false)} />
      <AddDocumentSheet open={add} onClose={() => setAdd(false)} onAdded={() => { setLocation('inbox'); setReloadKey(k => k + 1); }} />

      <Sheet open={actions && !sortOpen && !bulk} onClose={() => setActions(false)} title="Library actions">
        <SheetGroup>
          <SheetRow label="Manage tags" icon={<Tag size={18} />} onClick={() => { setActions(false); router.push('/library/tags'); }} />
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
        <p className="mb-3 px-1 text-[13px] text-ink-2">Applies to every document in this list.</p>
        <SheetGroup>
          {location === 'inbox' ? <SheetRow label="Archive all" onClick={() => bulkAction('archive')} /> : <SheetRow label="Move all to Inbox" onClick={() => bulkAction('inbox')} />}
        </SheetGroup>
        <SheetGroup>
          <SheetRow label="Delete all" danger onClick={() => bulkAction('delete')} />
        </SheetGroup>
      </Sheet>
    </div>
  );
}
