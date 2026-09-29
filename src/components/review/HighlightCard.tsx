'use client';

import { useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { ChevronDown, Pencil, Share2 } from 'lucide-react';
import Sheet, { SheetGroup, SheetRow } from '@/components/ui/Sheet';
import { colorSolid, HIGHLIGHT_COLORS } from '@/lib/colors';
import { useToast } from '@/components/ui/Toast';

export interface BrowseHighlight {
  id: string;
  text: string;
  kind?: string;
  imageUrl?: string | null;
  note: string | null;
  color: string;
  title?: string | null;
  author?: string | null;
  url?: string | null;
  tags?: string | null;
  documentId?: string | null;
  document?: { id: string; title?: string; coverImage: string | null; imageUrl: string | null; type?: string } | null;
}

interface Props {
  highlight: BrowseHighlight;
  compact?: boolean;
  onChange?: (h: BrowseHighlight) => void;
}

/**
 * Highlight card (docs/ux-spec.md §3.7.2): colour bar, cover + title + author, serif text,
 * icon row (edit note · share), NOTE, ˅ menu.
 */
export default function HighlightCard({ highlight: h, compact, onChange }: Props) {
  const { toast } = useToast();
  const [menu, setMenu] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [note, setNote] = useState(h.note ?? '');
  const image = h.document?.coverImage ?? h.document?.imageUrl ?? null;
  const title = h.document?.title ?? h.title ?? 'Untitled';

  const patch = async (data: Record<string, unknown>) => {
    const res = await fetch(`/api/highlights/${h.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (res.ok) onChange?.({ ...h, ...(await res.json()) });
  };
  const share = async () => {
    setMenu(false);
    if (navigator.share) { try { await navigator.share({ text: `“${h.text}”${h.title ? ` — ${h.title}` : ''}` }); } catch {} }
    else { await navigator.clipboard.writeText(h.text); toast('Copied'); }
  };
  const copy = async () => { await navigator.clipboard.writeText(h.text); setMenu(false); toast('Copied'); };

  return (
    <div className="relative overflow-hidden rounded-lg bg-surface-group shadow-[0_2px_6px_rgba(0,0,0,.25)]">
      <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: colorSolid(h.color) }} />
      <div className={`pl-4 pr-3 ${compact ? 'py-3' : 'py-4'}`}>
        <div className="mb-3 flex items-start gap-3">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
          ) : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-surface-active font-serif text-[11px] text-ink-2">{title.slice(0, 2)}</span>}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-bold leading-5 text-ink">{h.documentId ? <Link href={`/read/${h.documentId}?from=/review`}>{title}</Link> : title}</p>
            {(h.author) && <p className="truncate text-[14px] text-ink-2">{h.author}</p>}
          </div>
          <button onClick={() => setMenu(true)} aria-label="Highlight menu" className="-mr-1 flex h-8 w-8 items-center justify-center text-ink-2"><ChevronDown size={18} /></button>
        </div>

        {h.kind === 'image' && h.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={h.imageUrl} alt="" className="max-h-60 rounded-md" />
        ) : (
          <div className={`font-serif text-ink-ui ${compact ? 'text-[17px] leading-6 line-clamp-4' : 'text-[20px] leading-7'}`}>
            <ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]}>{h.text}</ReactMarkdown>
          </div>
        )}

        {h.tags && <p className="mt-2 flex flex-wrap gap-1.5">{h.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => <span key={t} className="rounded bg-chip px-1.5 text-[12px] leading-5 text-ink-2">{t}</span>)}</p>}

        {!compact && (
          <div className="mt-3 flex justify-end gap-5 text-accent">
            <button onClick={() => setNoteOpen(true)} aria-label="Edit note"><Pencil size={18} /></button>
            <button onClick={share} aria-label="Share"><Share2 size={18} /></button>
          </div>
        )}

        {h.note && (
          <div className="mt-3 border-t border-[#1d2329] pt-3">
            <p className="mb-1 text-[11px] uppercase tracking-wide text-ink-2">Note</p>
            <p className="text-[14px] leading-5 text-ink-2">{h.note}</p>
          </div>
        )}
      </div>

      <Sheet open={menu && !noteOpen && !colorOpen} onClose={() => setMenu(false)} title="Highlight">
        <SheetGroup>
          {h.documentId && <SheetRow label="View in document" onClick={() => { window.location.href = `/read/${h.documentId}?from=/review`; }} />}
          {h.url && <SheetRow label="Open original" onClick={() => { window.open(h.url!, '_blank', 'noopener'); setMenu(false); }} />}
          <SheetRow label="Copy text" onClick={copy} />
          <SheetRow label="Edit note" onClick={() => setNoteOpen(true)} />
          <SheetRow label="Change colour" onClick={() => setColorOpen(true)} />
        </SheetGroup>
      </Sheet>
      <Sheet open={noteOpen} onClose={() => { setNoteOpen(false); setMenu(false); }} title="Note" left={<button onClick={() => setNoteOpen(false)}>Cancel</button>} right={<button onClick={() => { patch({ note }); setNoteOpen(false); setMenu(false); }} className="font-medium text-accent">Save</button>}>
        <textarea autoFocus value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..." className="h-40 w-full resize-none rounded-group bg-surface-group px-3 py-2 text-[16px] text-ink placeholder:text-ink-2 focus:outline-none" />
      </Sheet>
      <Sheet open={colorOpen} onClose={() => { setColorOpen(false); setMenu(false); }} title="Colour">
        <div className="flex justify-around py-4">
          {HIGHLIGHT_COLORS.map(c => (
            <button key={c.id} aria-label={c.label} onClick={() => { patch({ color: c.id }); setColorOpen(false); setMenu(false); }} className={`h-10 w-10 rounded-full ${c.id === h.color ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-sheet' : ''}`} style={{ background: colorSolid(c.id) }} />
          ))}
        </div>
      </Sheet>
    </div>
  );
}
