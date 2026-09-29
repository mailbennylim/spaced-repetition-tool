'use client';

import { useRef, useState } from 'react';
import { Link as LinkIcon, Upload } from 'lucide-react';
import Sheet, { SheetGroup, SheetRow } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import type { DocumentSummary } from '@/lib/documents';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdded: (doc: DocumentSummary) => void;
}

/** ⊕ Add document sheet (docs/ux-spec.md §3.2): Cancel · "Add document" · Add, link field, paste, upload. */
export default function AddDocumentSheet({ open, onClose, onAdded }: Props) {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const add = async (value = url) => {
    const v = value.trim();
    if (!v || busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: v }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      onAdded(data);
      setUrl('');
      onClose();
      toast(data.existed ? 'Already saved. Moved to top of Inbox' : 'Saved to Inbox', { actionLabel: 'Open', onAction: () => { window.location.href = `/read/${data.id}`; } });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to save');
    } finally { setBusy(false); }
  };

  const paste = async () => {
    try { const text = await navigator.clipboard.readText(); if (text) { setUrl(text); add(text); } else toast('Clipboard is empty'); }
    catch { toast("Couldn't read the clipboard"); }
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/documents', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      onAdded(data);
      onClose();
      toast('Saved to Inbox', { actionLabel: 'Open', onAction: () => { window.location.href = `/read/${data.id}`; } });
    } catch (e) { toast(e instanceof Error ? e.message : 'Upload failed'); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add document"
      left={<button onClick={onClose}>Cancel</button>}
      right={<button onClick={() => add()} disabled={!url.trim() || busy} className="font-medium text-accent disabled:opacity-40">{busy ? 'Adding…' : 'Add'}</button>}
    >
      <input
        autoFocus
        type="url"
        inputMode="url"
        value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') add(); }}
        placeholder="Add link"
        className="mb-3 h-11 w-full rounded-group bg-surface-group px-3 text-[16px] text-ink placeholder:text-ink-2 focus:outline-none"
      />
      <SheetGroup>
        <SheetRow label={<span className="flex items-center gap-3"><LinkIcon size={18} className="text-ink-2" />Paste from clipboard</span>} onClick={paste} />
        <SheetRow label={<span className="flex items-center gap-3"><Upload size={18} className="text-ink-2" />Upload a file</span>} onClick={() => fileRef.current?.click()} />
      </SheetGroup>
      <p className="px-1 text-[12px] text-ink-2">EPUB, PDF and Markdown files.</p>
      <input ref={fileRef} type="file" accept=".epub,.pdf,.md,.markdown,.txt" className="hidden" onChange={e => upload(e.target.files?.[0])} />
    </Sheet>
  );
}
