'use client';

import { useState } from 'react';
import { Tag, MessageSquare, Pencil, RotateCcw, ExternalLink, Link as LinkIcon, Share2, Archive, Inbox, BookmarkPlus, Eye, EyeOff } from 'lucide-react';
import Sheet, { SheetGroup, SheetRow } from '@/components/ui/Sheet';
import NotesAndTagsSheet from '@/components/app/NotesAndTagsSheet';
import { useToast } from '@/components/ui/Toast';
import type { DocumentSummary } from '@/lib/documents';

interface Props {
  doc: DocumentSummary | null;
  onClose: () => void;
  /** Called after any change so the list can refresh / remove the row. */
  onChanged: (doc: DocumentSummary | null, action: string) => void;
}

/** Row ⋯ / long-press sheet (docs/ux-spec.md §3.4). */
export default function DocumentActionsSheet({ doc, onClose, onChanged }: Props) {
  const { toast } = useToast();
  const [notes, setNotes] = useState<'note' | 'tags' | null>(null);
  const [editMeta, setEditMeta] = useState(false);

  if (!doc) return <Sheet open={false} onClose={onClose}><div /></Sheet>;

  const patch = async (data: Record<string, unknown>) => {
    const res = await fetch(`/api/documents/${doc.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.ok ? (await res.json()) as DocumentSummary : null;
  };

  const move = async (location: 'inbox' | 'archive') => {
    onClose();
    const prev = doc.location;
    const updated = await patch({ location });
    onChanged(updated, 'move');
    toast(location === 'archive' ? 'Archived' : 'Moved to Inbox', { actionLabel: 'Undo', onAction: async () => onChanged(await patch({ location: prev }), 'undo') });
  };

  const saveToLibrary = async () => {
    onClose();
    const updated = await patch({ saveToLibrary: true });
    onChanged(updated, 'save');
    toast('Saved to Inbox', { actionLabel: 'Open', onAction: () => { window.location.href = `/read/${doc.id}`; } });
  };

  const toggleSeen = async () => {
    onClose();
    onChanged(await patch({ seen: !doc.seen }), 'seen');
  };

  const del = async () => {
    onClose();
    const updated = await patch({ trash: true });
    onChanged(updated, 'delete');
    toast('Moved to Trash', { actionLabel: 'Undo', onAction: async () => onChanged(await patch({ trash: false }), 'undo') });
  };

  const share = async () => {
    onClose();
    const url = doc.url || `${window.location.origin}/read/${doc.id}`;
    if (navigator.share) { try { await navigator.share({ title: doc.title, url }); } catch { /* cancelled */ } }
    else { await navigator.clipboard.writeText(url); toast('Link copied'); }
  };

  const copyUrl = async () => {
    onClose();
    await navigator.clipboard.writeText(doc.url || `${window.location.origin}/read/${doc.id}`);
    toast('Link copied');
  };

  return (
    <>
      <Sheet open={!!doc && !notes && !editMeta} onClose={onClose} title={undefined} right={<button onClick={onClose} className="text-[16px] font-medium text-accent">Done</button>} left={<span />}>
        <p className="mb-3 mt-[-8px] truncate text-center text-[13px] text-ink-2">{doc.title}</p>
        <SheetGroup>
          <SheetRow label="Add document tag" icon={<Tag size={18} />} onClick={() => setNotes('tags')} />
          <SheetRow label="Add document note" icon={<MessageSquare size={18} />} onClick={() => setNotes('note')} />
        </SheetGroup>
        <SheetGroup>
          <SheetRow label="Edit metadata" icon={<Pencil size={18} />} onClick={() => setEditMeta(true)} />
          <SheetRow label="Reset reading progress" icon={<RotateCcw size={18} />} onClick={async () => { onClose(); onChanged(await patch({ resetProgress: true }), 'progress'); toast('Progress reset'); }} />
        </SheetGroup>
        <SheetGroup>
          {doc.url && <SheetRow label="Open original" icon={<ExternalLink size={18} />} onClick={() => { onClose(); window.open(doc.url!, '_blank', 'noopener'); }} />}
          <SheetRow label="Copy document URL" icon={<LinkIcon size={18} />} onClick={copyUrl} />
          <SheetRow label="Share" icon={<Share2 size={18} />} onClick={share} />
        </SheetGroup>
        <SheetGroup>
          {doc.isFeed ? (
            <>
              <SheetRow label="Save to Library" icon={<BookmarkPlus size={18} />} onClick={saveToLibrary} />
              <SheetRow label={doc.seen ? 'Mark as unseen' : 'Mark as seen'} icon={doc.seen ? <EyeOff size={18} /> : <Eye size={18} />} onClick={toggleSeen} />
            </>
          ) : doc.location === 'archive' ? (
            <SheetRow label="Move to Inbox" icon={<Inbox size={18} />} onClick={() => move('inbox')} />
          ) : (
            <SheetRow label="Archive" icon={<Archive size={18} />} onClick={() => move('archive')} />
          )}
        </SheetGroup>
        <SheetGroup>
          <SheetRow label="Delete document" danger onClick={del} />
        </SheetGroup>
      </Sheet>

      <NotesAndTagsSheet
        open={!!notes}
        onClose={() => { setNotes(null); onClose(); }}
        initialTab={notes ?? 'note'}
        note={doc.note ?? ''}
        tags={doc.tags}
        onSave={async v => { onChanged(await patch({ note: v.note, tags: v.tags }), 'notes'); }}
      />

      <EditMetadataSheet open={editMeta} doc={doc} onClose={() => { setEditMeta(false); onClose(); }} onSave={async v => { onChanged(await patch(v), 'meta'); }} />
    </>
  );
}

export function EditMetadataSheet({ open, doc, onClose, onSave }: { open: boolean; doc: DocumentSummary; onClose: () => void; onSave: (v: { title: string; author: string }) => void }) {
  const [title, setTitle] = useState(doc.title);
  const [author, setAuthor] = useState(doc.author ?? '');
  const done = () => { onSave({ title, author }); onClose(); };
  return (
    <Sheet open={open} onClose={onClose} title="Edit metadata" left={<button onClick={onClose}>Cancel</button>} right={<button onClick={done} className="font-medium text-accent">Save</button>}>
      <label className="mb-1 block text-[12px] uppercase tracking-wide text-ink-2">Title</label>
      <input value={title} onChange={e => setTitle(e.target.value)} className="mb-4 h-11 w-full rounded-group bg-surface-group px-3 text-[16px] text-ink focus:outline-none" />
      <label className="mb-1 block text-[12px] uppercase tracking-wide text-ink-2">Author</label>
      <input value={author} onChange={e => setAuthor(e.target.value)} className="h-11 w-full rounded-group bg-surface-group px-3 text-[16px] text-ink focus:outline-none" />
    </Sheet>
  );
}
