'use client';

import { useState } from 'react';
import { Inbox, Archive, Share2, Volume2, Square, Search, Type, Pencil, MessageSquare, Minus, Plus, ExternalLink, Copy } from 'lucide-react';
import Sheet, { SheetGroup, SheetRow, Switch } from '@/components/ui/Sheet';
import { FONT_OPTIONS, type ReaderDocument, type ReaderSettings, type TocItem, type HighlightRecord } from '@/lib/reader-types';
import { readingMinutes, formatMinutes, rowDate } from '@/lib/format';

// ── ⋯ Actions sheet (docs/ux-spec.md §3.5) ───────────────────────────────────

interface ActionsProps {
  open: boolean;
  onClose: () => void;
  doc: ReaderDocument;
  settings: ReaderSettings;
  listening: boolean;
  onToggleAutoHighlight: (v: boolean) => void;
  onMove: (location: 'inbox' | 'archive') => void;
  onShare: () => void;
  onListen: () => void;
  onFind: () => void;
  onAppearance: () => void;
  onEditMetadata: () => void;
  onNotesAndTags: () => void;
  onDelete: () => void;
}

export function ActionsSheet(p: ActionsProps) {
  const tile = (label: string, icon: React.ReactNode, active: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      disabled={active}
      className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[12px] ${active ? 'text-ink-3' : 'text-ink'}`}
    >
      {icon}{label}
    </button>
  );
  return (
    <Sheet open={p.open} onClose={p.onClose} title="Actions">
      {!p.doc.isFeed && (
        <div className="mb-3 flex divide-x divide-[#1d2329] overflow-hidden rounded-group bg-surface-group">
          {tile('Inbox', <Inbox size={20} />, p.doc.location === 'inbox', () => p.onMove('inbox'))}
          {tile('Archive', <Archive size={20} />, p.doc.location === 'archive', () => p.onMove('archive'))}
        </div>
      )}
      <SheetGroup>
        <SheetRow label="Toggle autohighlighting" right={<Switch checked={p.settings.autoHighlight} onChange={p.onToggleAutoHighlight} />} onClick={() => p.onToggleAutoHighlight(!p.settings.autoHighlight)} />
        <SheetRow label="Share document" icon={<Share2 size={18} />} onClick={p.onShare} />
        <SheetRow label={p.listening ? 'Stop text-to-speech' : 'Listen using text-to-speech'} icon={p.listening ? <Square size={18} /> : <Volume2 size={18} />} onClick={p.onListen} />
        <SheetRow label="Find in document" icon={<Search size={18} />} onClick={p.onFind} />
        <SheetRow label="Appearance" icon={<Type size={18} />} onClick={p.onAppearance} />
        <SheetRow label="Edit metadata" icon={<Pencil size={18} />} onClick={p.onEditMetadata} />
        <SheetRow label="Note and tags" icon={<MessageSquare size={18} />} onClick={p.onNotesAndTags} />
      </SheetGroup>
      <SheetGroup>
        <SheetRow label="Delete document" danger onClick={p.onDelete} />
      </SheetGroup>
    </Sheet>
  );
}

// ── Aa Appearance sheet (docs/ux-spec.md §3.5) ───────────────────────────────

interface AppearanceProps {
  open: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onChange: (patch: Partial<ReaderSettings>) => void;
  /** Line width isn't meaningful for EPUB/PDF. */
  showLineWidth?: boolean;
}

export function AppearanceSheet({ open, onClose, settings, onChange, showLineWidth = true }: AppearanceProps) {
  const fontIdx = Math.max(0, FONT_OPTIONS.findIndex(f => f.id === settings.readerFont));
  const widths = ['narrow', 'medium', 'wide'];
  const wIdx = Math.max(0, widths.indexOf(settings.readerLineWidth));
  const Row = ({ icon, label, value, onMinus, onPlus }: { icon: React.ReactNode; label: string; value: string; onMinus: () => void; onPlus: () => void }) => (
    <div className="flex h-[50px] items-center gap-3 border-t border-[#1d2329] px-4 first:border-t-0">
      <span className="text-ink-2">{icon}</span>
      <span className="flex-1 text-[16px] text-ink">{label}</span>
      <span className="w-[76px] text-right text-[14px] text-ink-2">{value}</span>
      <button onClick={onMinus} aria-label={`Decrease ${label}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-active text-ink"><Minus size={14} /></button>
      <button onClick={onPlus} aria-label={`Increase ${label}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-active text-ink"><Plus size={14} /></button>
    </div>
  );
  return (
    <Sheet open={open} onClose={onClose} title="Appearance">
      <p className="mb-2 px-1 text-[12px] uppercase tracking-wide text-ink-2">Text styles</p>
      <SheetGroup>
        <Row icon={<Type size={18} />} label="Typeface" value={FONT_OPTIONS[fontIdx].label}
          onMinus={() => onChange({ readerFont: FONT_OPTIONS[(fontIdx + FONT_OPTIONS.length - 1) % FONT_OPTIONS.length].id })}
          onPlus={() => onChange({ readerFont: FONT_OPTIONS[(fontIdx + 1) % FONT_OPTIONS.length].id })} />
        <Row icon={<span className="text-[13px] font-semibold">Aa</span>} label="Font size" value={`${settings.readerFontSize}px`}
          onMinus={() => onChange({ readerFontSize: Math.max(14, settings.readerFontSize - 1) })}
          onPlus={() => onChange({ readerFontSize: Math.min(40, settings.readerFontSize + 1) })} />
        <Row icon={<span className="text-[13px]">↕</span>} label="Line spacing" value={settings.readerLineHeight.toFixed(1)}
          onMinus={() => onChange({ readerLineHeight: Math.max(1.1, +(settings.readerLineHeight - 0.1).toFixed(1)) })}
          onPlus={() => onChange({ readerLineHeight: Math.min(2.2, +(settings.readerLineHeight + 0.1).toFixed(1)) })} />
        {showLineWidth && (
          <Row icon={<span className="text-[13px]">↔</span>} label="Line width" value={widths[wIdx][0].toUpperCase() + widths[wIdx].slice(1)}
            onMinus={() => onChange({ readerLineWidth: widths[Math.max(0, wIdx - 1)] })}
            onPlus={() => onChange({ readerLineWidth: widths[Math.min(2, wIdx + 1)] })} />
        )}
      </SheetGroup>
    </Sheet>
  );
}

// ── ☰ Contents sheet ─────────────────────────────────────────────────────────

export function ContentsSheet({ open, onClose, items, currentId, onJump }: { open: boolean; onClose: () => void; items: TocItem[]; currentId?: string | null; onJump: (item: TocItem) => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Contents" closeIcon>
      {items.length === 0 && <p className="px-1 py-6 text-center text-[14px] text-ink-2">No headings in this document.</p>}
      <ul>
        {items.map(it => (
          <li key={it.id}>
            <button
              onClick={() => { onJump(it); onClose(); }}
              className={`flex h-11 w-full items-center truncate text-left text-[15px] ${it.id === currentId ? 'text-accent' : 'text-ink-2'}`}
              style={{ paddingLeft: 4 + (it.level - 1) * 16 }}
            >
              <span className="truncate">{it.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

// ── ⓘ Info / Notebook sheet (docs/ux-spec.md §3.5) ───────────────────────────

interface InfoProps {
  open: boolean;
  onClose: () => void;
  doc: ReaderDocument;
  highlights: HighlightRecord[];
  onEditMetadata: () => void;
  onOpenTags: () => void;
  onNoteChange: (note: string) => void;
  onHighlightTap: (h: HighlightRecord) => void;
  onExport: () => void;
}

export function InfoSheet({ open, onClose, doc, highlights, onEditMetadata, onOpenTags, onNoteChange, onHighlightTap, onExport }: InfoProps) {
  const [tab, setTab] = useState<'info' | 'notebook'>('info');
  const [note, setNote] = useState(doc.note ?? '');
  const mins = readingMinutes(doc.wordCount);
  const Meta = ({ k, v }: { k: string; v: React.ReactNode }) => v ? (
    <div className="flex h-8 items-center text-[14px]"><span className="w-[100px] shrink-0 text-ink-2">{k}</span><span className="truncate text-ink-ui">{v}</span></div>
  ) : null;

  return (
    <Sheet open={open} onClose={onClose} tall left={<span />} right={<button onClick={onClose} className="text-[16px] font-medium text-accent">Done</button>}>
      <div className="-mt-11 mb-4 flex justify-center gap-6 text-[14px] font-medium">
        <button onClick={() => setTab('info')} className={`border-b-2 pb-1 ${tab === 'info' ? 'border-ink text-ink' : 'border-transparent text-ink-2'}`}>Info</button>
        <button onClick={() => setTab('notebook')} className={`border-b-2 pb-1 ${tab === 'notebook' ? 'border-ink text-ink' : 'border-transparent text-ink-2'}`}>Notebook <span className="ml-1 rounded bg-surface-group px-1.5 text-[11px]">{highlights.length}</span></button>
      </div>

      {tab === 'info' ? (
        <div>
          <h3 className="text-[16px] font-semibold leading-5 text-ink">{doc.title}</h3>
          {doc.domain && (
            <div className="mt-1 flex items-center gap-2 text-[14px] text-ink-2">
              <a href={doc.url ?? '#'} target="_blank" rel="noopener" className="truncate">{doc.domain}</a>
              <button onClick={() => doc.url && navigator.clipboard.writeText(doc.url)} aria-label="Copy link" className="text-ink-2"><Copy size={14} /></button>
            </div>
          )}
          {doc.author && <p className="mt-2 text-[14px] text-ink-ui">{doc.author}</p>}

          <p className="mb-2 mt-5 text-[11px] uppercase tracking-wide text-ink-2">Document tags</p>
          <div className="flex flex-wrap gap-1.5">
            {doc.tags.map(t => <span key={t} className="rounded bg-chip px-2 py-0.5 text-[13px] text-ink-ui">{t}</span>)}
            <button onClick={onOpenTags} className="rounded border border-dashed border-surface-active px-2 py-0.5 text-[13px] text-ink-2">+ Add tag</button>
          </div>

          <p className="mb-1 mt-5 text-[11px] uppercase tracking-wide text-ink-2">Metadata</p>
          <Meta k="Type" v={{ epub: 'Book', pdf: 'PDF', email: 'Email', rss: 'Feed' }[doc.type] ?? 'Article'} />
          <Meta k="Domain" v={doc.domain} />
          <Meta k="Published" v={doc.publishedAt ? rowDate(doc.publishedAt) : null} />
          <Meta k="Length" v={mins ? `${formatMinutes(mins)}${doc.wordCount ? ` (${doc.wordCount.toLocaleString()} words)` : ''}` : null} />
          <Meta k="Saved" v={rowDate(doc.savedAt)} />
          <Meta k="Progress" v={`${Math.round(doc.progress * 100)}%${mins ? ` (${formatMinutes(Math.max(1, Math.round(mins * (1 - doc.progress))))} left)` : ''}`} />
          <div className="mt-5 flex items-center justify-between">
            <button onClick={onEditMetadata} className="rounded-full border border-surface-active px-3 py-1.5 text-[14px] font-medium text-ink">Edit metadata</button>
            {doc.url && <a href={doc.url} target="_blank" rel="noopener" className="flex items-center gap-1 text-[14px] text-ink-2"><ExternalLink size={14} /> Open original</a>}
          </div>
        </div>
      ) : (
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-wide text-ink-2">Document note</p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            onBlur={() => note !== (doc.note ?? '') && onNoteChange(note)}
            placeholder="Add a document note..."
            className="mb-4 h-20 w-full resize-none rounded-group border border-transparent bg-surface-group px-3 py-2 text-[15px] text-ink placeholder:text-ink-2 focus:border-accent focus:outline-none"
          />
          <p className="mb-2 text-[11px] uppercase tracking-wide text-ink-2">Highlights ({highlights.length})</p>
          {highlights.length === 0 && <p className="py-6 text-center text-[14px] text-ink-2">Highlights will appear here</p>}
          <ul className="space-y-3">
            {highlights.map(h => (
              <li key={h.id}>
                <button onClick={() => { onHighlightTap(h); onClose(); }} className="w-full text-left">
                  {h.kind === 'image' && h.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={h.imageUrl} alt="" className="max-h-40 rounded-md" />
                  ) : (
                    <span className={`hl hl-${h.color} inline text-[14px] leading-6`}>{h.text}</span>
                  )}
                  {h.note && <p className="mt-1 text-[13px] text-ink-2">{h.note}</p>}
                </button>
              </li>
            ))}
          </ul>
          {highlights.length > 0 && (
            <div className="mt-6 flex gap-3">
              <button onClick={onExport} className="rounded-full border border-surface-active px-3 py-1.5 text-[14px] font-medium text-ink">Export</button>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

// ── Highlight ⋯ Actions sheet (docs/ux-spec.md §3.6) ─────────────────────────

export function HighlightActionsSheet({ open, onClose, highlight, autoHighlight, onToggleAutoHighlight }: { open: boolean; onClose: () => void; highlight: HighlightRecord | null; autoHighlight: boolean; onToggleAutoHighlight: (v: boolean) => void }) {
  const share = async () => {
    if (!highlight) return;
    onClose();
    if (navigator.share) { try { await navigator.share({ text: `“${highlight.text}”` }); } catch { /* cancelled */ } }
    else await navigator.clipboard.writeText(highlight.text);
  };
  const copy = async () => { if (highlight) await navigator.clipboard.writeText(highlight.text); onClose(); };
  return (
    <Sheet open={open} onClose={onClose} title="Actions">
      <SheetGroup>
        <SheetRow label="Share text" icon={<Share2 size={18} />} onClick={share} />
        <SheetRow label="Copy text" icon={<Copy size={18} />} onClick={copy} />
        <SheetRow label="Toggle autohighlighting" right={<Switch checked={autoHighlight} onChange={onToggleAutoHighlight} />} onClick={() => onToggleAutoHighlight(!autoHighlight)} />
      </SheetGroup>
    </Sheet>
  );
}

// ── Highlight note sheet (docs/ux-spec.md §3.6) ──────────────────────────────

export function HighlightNoteSheet({ open, onClose, note, onSave }: { open: boolean; onClose: () => void; note: string; onSave: (n: string) => void }) {
  const [draft, setDraft] = useState(note);
  const done = () => { onSave(draft); onClose(); };
  return (
    <Sheet open={open} onClose={done} tall left={<span />} right={<button onClick={done} className="text-[16px] font-medium text-accent">Done</button>}>
      <div className="-mt-11 mb-4 flex justify-center">
        <div className="inline-flex h-9 items-center rounded-full bg-surface-group p-1">
          <span className="flex h-7 w-12 items-center justify-center rounded-full bg-surface-active text-ink"><MessageSquare size={16} /></span>
        </div>
      </div>
      <textarea autoFocus value={draft} onChange={e => setDraft(e.target.value)} placeholder="Add a highlight note..." className="h-56 w-full resize-none bg-transparent text-[16px] leading-6 text-ink placeholder:text-ink-2 focus:outline-none" />
    </Sheet>
  );
}
