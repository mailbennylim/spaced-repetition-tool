'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Library, FileText, BookOpen, Mail, ChevronRight, ChevronDown, Trash2, Search, Tag } from 'lucide-react';
import Drawer, { DrawerGroup, DrawerSection } from '@/components/ui/Drawer';

interface TagInfo { id: string; name: string; count: number }

const TYPES = [
  { label: 'Articles', type: 'article', icon: FileText },
  { label: 'Books', type: 'epub', icon: BookOpen },
  { label: 'Emails', type: 'email', icon: Mail },
  { label: 'PDFs', type: 'pdf', icon: FileText },
];

function Row({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex h-12 items-center gap-3 border-t border-surface-1 px-4 text-[16px] text-ink first:border-t-0 active:bg-surface-1">
      <span className="text-ink-2">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      <ChevronRight size={16} className="text-ink-2" />
    </Link>
  );
}

/** Library ☰ Browse drawer (docs/ux-spec.md §3.2). */
export default function LibraryBrowseDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [q, setQ] = useState('');
  const [typesOpen, setTypesOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(true);

  useEffect(() => { if (open) fetch('/api/tags').then(r => r.json()).then(setTags).catch(() => {}); }, [open]);

  const shownTags = tags.filter(t => t.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerGroup>
        <Row href="/library" icon={<Library size={18} />} label="Library" onClick={onClose} />
      </DrawerGroup>

      <div className="mt-5">
        <DrawerSection title="Types" right={<button onClick={() => setTypesOpen(o => !o)} aria-label="Toggle" className="text-ink-2">{typesOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</button>}>
          {typesOpen && (
            <DrawerGroup>
              {TYPES.map(t => <Row key={t.type} href={`/library/type/${t.type}`} icon={<t.icon size={18} />} label={t.label} onClick={onClose} />)}
            </DrawerGroup>
          )}
        </DrawerSection>
      </div>

      <DrawerGroup>
        <Row href="/trash" icon={<Trash2 size={18} />} label="Trash" onClick={onClose} />
      </DrawerGroup>

      <div className="mt-5">
        <DrawerSection title="Tags" right={<button onClick={() => setTagsOpen(o => !o)} aria-label="Toggle" className="text-ink-2">{tagsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</button>}>
          {tagsOpen && (
            <>
              <div className="mb-3 flex h-10 items-center gap-2 rounded-group bg-surface-group px-3">
                <Search size={16} className="text-ink-2" />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Find tag" className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink-2 focus:outline-none" />
              </div>
              <p className="smallcaps mb-2 px-1 text-ink-2">Document tags</p>
              <DrawerGroup>
                {shownTags.length === 0 && <p className="px-4 py-3 text-[14px] text-ink-2">No tags yet</p>}
                {shownTags.map(t => <Row key={t.id} href={`/library/tag/${encodeURIComponent(t.name)}`} icon={<Tag size={16} />} label={t.name} onClick={onClose} />)}
              </DrawerGroup>
            </>
          )}
        </DrawerSection>
      </div>
    </Drawer>
  );
}
