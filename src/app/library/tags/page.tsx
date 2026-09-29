'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tag, ChevronRight, Search } from 'lucide-react';
import ListHeader from '@/components/app/ListHeader';
import TabBar from '@/components/app/TabBar';
import Sheet, { SheetGroup, SheetRow } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';

interface TagInfo { id: string; name: string; count: number }

/** Manage tags (docs/ux-spec.md §3.2 ⋯ → Manage tags). */
export default function ManageTagsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [q, setQ] = useState('');
  const [active, setActive] = useState<TagInfo | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState('');

  const load = () => fetch('/api/tags').then(r => r.json()).then(setTags).catch(() => {});
  useEffect(() => { load(); }, []);

  const rename = async () => {
    if (!active || !name.trim()) return;
    await fetch('/api/tags', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: active.id, name }) });
    setRenaming(false); setActive(null); load(); toast('Tag renamed');
  };
  const del = async () => {
    if (!active) return;
    await fetch('/api/tags', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: active.id, delete: true }) });
    setActive(null); load(); toast('Tag deleted');
  };

  const shown = tags.filter(t => t.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-28">
      <ListHeader title="Tags" onBack={() => router.back()} />
      <div className="px-4">
        <div className="mb-3 flex h-10 items-center gap-2 rounded-group bg-surface-group px-3">
          <Search size={16} className="text-ink-2" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Find tag" className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink-2 focus:outline-none" />
        </div>
        <div className="overflow-hidden rounded-group bg-surface-1">
          {shown.length === 0 && <p className="px-4 py-6 text-center text-[14px] text-ink-2">No tags yet. Add one from a document&apos;s ⋯ menu.</p>}
          {shown.map(t => (
            <div key={t.id} className="flex items-center border-t border-bg first:border-t-0">
              <Link href={`/library/tag/${encodeURIComponent(t.name)}`} className="flex h-12 flex-1 items-center gap-3 px-4 text-[16px] text-ink">
                <Tag size={16} className="text-ink-2" /><span className="flex-1 truncate">{t.name}</span><span className="text-[13px] text-ink-2">{t.count}</span>
              </Link>
              <button onClick={() => { setActive(t); setName(t.name); }} aria-label="Tag actions" className="flex h-12 w-10 items-center justify-center text-ink-2"><ChevronRight size={16} /></button>
            </div>
          ))}
        </div>
      </div>
      <TabBar />

      <Sheet open={!!active && !renaming} onClose={() => setActive(null)} title={active?.name}>
        <SheetGroup><SheetRow label="Rename" onClick={() => setRenaming(true)} /></SheetGroup>
        <SheetGroup><SheetRow label="Delete tag" danger onClick={del} /></SheetGroup>
      </Sheet>
      <Sheet open={renaming} onClose={() => setRenaming(false)} title="Rename tag" left={<button onClick={() => setRenaming(false)}>Cancel</button>} right={<button onClick={rename} className="font-medium text-accent">Save</button>}>
        <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') rename(); }} className="h-11 w-full rounded-group bg-surface-group px-3 text-[16px] text-ink focus:outline-none" />
      </Sheet>
    </div>
  );
}
