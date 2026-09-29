'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { ReaderDocument, ReaderSettings, HighlightRecord, PendingSelection, ActiveHighlight, TocItem, ReaderHandle } from '@/lib/reader-types';
import type { DocumentSummary } from '@/lib/documents';
import ReaderChrome, { useAutoHideChrome } from '@/components/reader/ReaderChrome';
import HighlightToolbar from '@/components/reader/HighlightToolbar';
import { ActionsSheet, AppearanceSheet, ContentsSheet, InfoSheet, HighlightActionsSheet, HighlightNoteSheet } from '@/components/reader/ReaderSheets';
import NotesAndTagsSheet from '@/components/app/NotesAndTagsSheet';
import { EditMetadataSheet } from '@/components/app/DocumentActionsSheet';
import ListenPlayer from '@/components/reader/ListenPlayer';
import { useToast } from '@/components/ui/Toast';

const ArticleReader = dynamic(() => import('@/components/reader/ArticleReader'), { ssr: false });
const EpubReader = dynamic(() => import('@/components/reader/EpubReader'), { ssr: false });
const PdfReader = dynamic(() => import('@/components/reader/PdfReader'), { ssr: false });

const DEFAULT_SETTINGS: ReaderSettings = { autoHighlight: false, autoAdvance: false, defaultColor: 'yellow', readerFont: 'serif', readerFontSize: 20, readerLineHeight: 1.4, readerLineWidth: 'medium', ttsVoice: null, ttsRate: 1 };

type SheetName = 'actions' | 'appearance' | 'contents' | 'info' | 'notes' | 'tags' | 'hlNote' | 'hlActions' | 'editMeta' | null;

export default function ReadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const from = useSearchParams().get('from') || '/library';
  const { toast } = useToast();

  const [doc, setDoc] = useState<ReaderDocument | null>(null);
  const [highlights, setHighlights] = useState<HighlightRecord[]>([]);
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const [active, setActive] = useState<ActiveHighlight | null>(null);
  const [sheet, setSheet] = useState<SheetName>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [currentToc, setCurrentToc] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [barsVisible, setBarsVisible] = useState(false);
  const [find, setFind] = useState<{ open: boolean; query: string; count: number; index: number } | null>(null);
  const [returnTo, setReturnTo] = useState<number | null>(null);
  const returnDismissed = useRef(false);
  const handleRef = useRef<ReaderHandle | null>(null);
  const [handle, setHandle] = useState<ReaderHandle | null>(null);
  const progressRef = useRef({ current: 0, furthest: 0, position: null as unknown, dirty: false });
  const lastColor = useRef<string>('yellow');

  const layout: 'short' | 'long' = doc && (doc.type === 'epub' || doc.type === 'pdf') ? 'long' : 'short';
  const [hideChrome, setHideChrome] = useAutoHideChrome(layout === 'short');

  // ── Load ────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [d, s] = await Promise.all([fetch(`/api/documents/${id}`).then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); }), fetch('/api/settings').then(r => r.json())]);
        setDoc(d); setHighlights(d.highlights ?? []);
        setSettings({ ...DEFAULT_SETTINGS, ...s });
        lastColor.current = s.defaultColor ?? 'yellow';
        progressRef.current.furthest = d.progress ?? 0;
        fetch(`/api/documents/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ opened: true }) });
      } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    })();
  }, [id]);

  // ── Progress: throttled save, flush on leave ────────────────────────────
  const flushProgress = useCallback(() => {
    const p = progressRef.current; if (!p.dirty) return; p.dirty = false;
    const body = JSON.stringify({ progress: p.furthest, position: p.position });
    fetch(`/api/documents/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  }, [id]);
  useEffect(() => {
    const t = setInterval(flushProgress, 3000);
    window.addEventListener('pagehide', flushProgress);
    return () => { clearInterval(t); window.removeEventListener('pagehide', flushProgress); flushProgress(); };
  }, [flushProgress]);

  const onProgress = useCallback((ratio: number, position: unknown) => {
    const p = progressRef.current;
    p.current = ratio; p.position = position; p.dirty = true;
    if (ratio > p.furthest) { p.furthest = ratio; setReturnTo(null); }
    else if (!returnDismissed.current && p.furthest - ratio > 0.05 && p.furthest > 0.03) setReturnTo(p.furthest);
    else setReturnTo(null);
  }, []);

  // ── Settings ────────────────────────────────────────────────────────────
  const patchSettings = useCallback((patch: Partial<ReaderSettings>) => {
    setSettings(s => ({ ...s, ...patch }));
    fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).catch(() => {});
  }, []);

  // ── Document actions ────────────────────────────────────────────────────
  const patchDoc = useCallback(async (data: Record<string, unknown>) => {
    const res = await fetch(`/api/documents/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) return null;
    const updated: DocumentSummary = await res.json();
    setDoc(d => (d ? { ...d, ...updated } : d));
    return updated;
  }, [id]);

  const leave = useCallback(() => router.push(from), [router, from]);

  const openNext = useCallback(async () => {
    const q = from.includes('/feed') ? 'scope=feed&seen=false' : `scope=library&location=${doc?.location ?? 'inbox'}`;
    const res = await fetch(`/api/documents?${q}&limit=5`); const { items } = await res.json();
    const next = (items as DocumentSummary[]).find(d => d.id !== id);
    if (next) router.replace(`/read/${next.id}?from=${encodeURIComponent(from)}`); else leave();
  }, [from, doc?.location, id, router, leave]);

  const move = async (location: 'inbox' | 'archive') => {
    setSheet(null);
    const prev = doc?.location;
    await patchDoc({ location });
    toast(location === 'archive' ? 'Archived' : 'Moved to Inbox', { actionLabel: 'Undo', onAction: () => patchDoc({ location: prev }) });
    if (settings.autoAdvance) openNext(); else leave();
  };
  const del = async () => {
    setSheet(null);
    await patchDoc({ trash: true });
    toast('Moved to Trash', { actionLabel: 'Undo', onAction: () => patchDoc({ trash: false }) });
    leave();
  };
  const share = async () => {
    setSheet(null); if (!doc) return;
    const url = doc.url || window.location.href;
    if (navigator.share) { try { await navigator.share({ title: doc.title, url }); } catch {} } else { await navigator.clipboard.writeText(url); toast('Link copied'); }
  };
  const exportNotebook = async () => {
    if (!doc) return;
    const md = [`# ${doc.title}`, doc.author ? `*${doc.author}*` : '', doc.url ? `<${doc.url}>` : '', '', doc.note ? `> **Note:** ${doc.note}\n` : '', ...highlights.map(h => `- ${h.kind === 'image' ? `![](${h.imageUrl})` : h.text}${h.note ? `\n  - *${h.note}*` : ''}`)].filter(x => x !== null).join('\n');
    if (navigator.share) { try { await navigator.share({ title: doc.title, text: md }); return; } catch {} }
    await navigator.clipboard.writeText(md); toast('Notebook copied as Markdown');
  };

  // ── Highlights ──────────────────────────────────────────────────────────
  const clearSelection = () => { window.getSelection()?.removeAllRanges(); setPending(null); };

  const createHighlight = useCallback(async (sel: PendingSelection, color = lastColor.current) => {
    const res = await fetch(`/api/documents/${id}/highlights`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'text', text: sel.text, position: sel.position, color }) });
    if (!res.ok) { toast("Couldn't save highlight"); return; }
    const h: HighlightRecord = await res.json();
    setHighlights(prev => [...prev, h]);
    setDoc(d => (d ? { ...d, highlightCount: d.highlightCount + 1 } : d));
    window.getSelection()?.removeAllRanges(); setPending(null);
    setActive({ id: h.id, y: sel.y });
  }, [id, toast]);

  const onPending = useCallback((sel: PendingSelection | null) => {
    if (sel && settings.autoHighlight) { createHighlight(sel); return; }
    setPending(sel); if (sel) setActive(null);
  }, [settings.autoHighlight, createHighlight]);

  const activeHl = active ? highlights.find(h => h.id === active.id) ?? null : null;

  const recolor = async (color: string) => {
    lastColor.current = color;
    if (pending) { createHighlight(pending, color); return; }
    if (!activeHl) return;
    setHighlights(prev => prev.map(h => (h.id === activeHl.id ? { ...h, color } : h)));
    fetch(`/api/highlights/${activeHl.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ color }) });
  };
  const deleteHighlight = async () => {
    if (!activeHl) return;
    const gone = activeHl; setActive(null);
    setHighlights(prev => prev.filter(h => h.id !== gone.id));
    await fetch(`/api/highlights/${gone.id}`, { method: 'DELETE' });
    toast('Highlight deleted', { actionLabel: 'Undo', onAction: async () => {
      const res = await fetch(`/api/documents/${id}/highlights`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: gone.kind, text: gone.text, position: gone.position ? JSON.parse(gone.position) : null, color: gone.color, note: gone.note }) });
      if (res.ok) { const restored: HighlightRecord = await res.json(); setHighlights(prev => [...prev, restored]); }
    } });
  };
  const saveHighlightNote = async (note: string) => {
    if (!activeHl) return;
    setHighlights(prev => prev.map(h => (h.id === activeHl.id ? { ...h, note: note.trim() || null } : h)));
    fetch(`/api/highlights/${activeHl.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }) });
  };

  // ── Find ────────────────────────────────────────────────────────────────
  const onFindChange = (query: string) => { const count = handleRef.current?.find(query) ?? 0; setFind({ open: true, query, count, index: 0 }); };
  const onFindNext = (dir: 1 | -1) => { const index = handleRef.current?.findNext(dir) ?? 0; setFind(f => (f ? { ...f, index } : f)); };
  const closeFind = () => { handleRef.current?.find(''); setFind(null); };

  // ── Reader callbacks ────────────────────────────────────────────────────
  const registerHandle = useCallback((h: ReaderHandle) => { handleRef.current = h; setHandle(h); }, []);
  const onTap = useCallback(() => { if (layout === 'long') setBarsVisible(v => !v); else setHideChrome(h => !h); }, [layout, setHideChrome]);
  const readerProps = useMemo(() => doc && ({
    doc, highlights, settings, activeHighlightId: active?.id ?? null,
    onPending, onActive: setActive, onProgress, onToc: setToc, onCurrentToc: setCurrentToc, onTap, registerHandle,
  }), [doc, highlights, settings, active?.id, onPending, onProgress, onTap, registerHandle]);

  // Esc closes the toolbar; keyboard shortcuts (docs/ux-spec.md §5)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches('input, textarea')) return;
      if (e.key === 'Escape') { setActive(null); setPending(null); setSheet(null); }
      if (e.key === 'p' || e.key === 'P') setListening(l => !l);
      if (e.key === 'e' && !e.shiftKey && !e.metaKey) move('archive');
      if (e.key === 'E' && e.shiftKey) move('inbox');
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') { e.preventDefault(); setFind({ open: true, query: '', count: 0, index: 0 }); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);

  if (error) return <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-reader-bg"><p className="text-danger">{error}</p><button onClick={leave} className="text-accent">Back</button></div>;
  if (!doc || !readerProps) return <div className="min-h-dvh bg-reader-bg" />;

  const toolbarMode = pending ? 'pending' : active ? 'active' : null;
  const toolbarColor = activeHl?.color ?? lastColor.current;

  return (
    <div className={`bg-reader-bg ${listening ? 'pb-24' : ''}`}>
      {doc.type === 'epub' ? <EpubReader {...readerProps} /> : doc.type === 'pdf' ? <PdfReader {...readerProps} /> : <ArticleReader {...readerProps} />}

      <ReaderChrome
        layout={layout}
        title={doc.title}
        progress={Math.max(progressRef.current.current, 0)}
        location={doc.location}
        isFeed={doc.isFeed}
        returnTo={returnTo}
        hideChrome={hideChrome || !!toolbarMode}
        barsVisible={barsVisible}
        onBack={leave}
        onContents={() => setSheet('contents')}
        onListen={() => setListening(true)}
        onInfo={() => setSheet('info')}
        onAppearance={() => setSheet('appearance')}
        onNotesAndTags={() => setSheet('notes')}
        onToggleLocation={() => move(doc.location === 'archive' ? 'inbox' : 'archive')}
        onMore={() => setSheet('actions')}
        onReturn={() => { handleRef.current?.returnToProgress(); setReturnTo(null); }}
        onDismissReturn={() => { returnDismissed.current = true; setReturnTo(null); }}
        find={find}
        onFindChange={onFindChange}
        onFindNext={onFindNext}
        onFindClose={closeFind}
      />

      <HighlightToolbar
        mode={toolbarMode}
        y={pending?.y ?? active?.y ?? 0}
        color={toolbarColor}
        onHighlight={() => pending && createHighlight(pending)}
        onColor={recolor}
        onNote={() => setSheet('hlNote')}
        onMore={() => setSheet('hlActions')}
        onDelete={deleteHighlight}
      />

      {listening && handle && (
        <ListenPlayer
          handle={handle}
          voiceName={settings.ttsVoice}
          rate={settings.ttsRate}
          onSettings={patchSettings}
          onStop={() => setListening(false)}
          bottomOffset={layout === 'long' && barsVisible ? 60 : layout === 'short' && !hideChrome ? 60 : 0}
        />
      )}

      <ActionsSheet
        open={sheet === 'actions'} onClose={() => setSheet(null)} doc={doc} settings={settings} listening={listening}
        onToggleAutoHighlight={v => patchSettings({ autoHighlight: v })}
        onMove={move} onShare={share}
        onListen={() => { setSheet(null); setListening(l => !l); }}
        onFind={() => { setSheet(null); setFind({ open: true, query: '', count: 0, index: 0 }); }}
        onAppearance={() => setSheet('appearance')}
        onEditMetadata={() => setSheet('editMeta')}
        onNotesAndTags={() => setSheet('notes')}
        onDelete={del}
      />
      <AppearanceSheet open={sheet === 'appearance'} onClose={() => setSheet(null)} settings={settings} onChange={patchSettings} showLineWidth={layout === 'short'} />
      <ContentsSheet open={sheet === 'contents'} onClose={() => setSheet(null)} items={toc} currentId={currentToc} onJump={it => handleRef.current?.jumpTo(it.target)} />
      <InfoSheet
        open={sheet === 'info'} onClose={() => setSheet(null)} doc={doc} highlights={highlights}
        onEditMetadata={() => setSheet('editMeta')} onOpenTags={() => setSheet('tags')}
        onNoteChange={note => patchDoc({ note })}
        onHighlightTap={h => { setActive({ id: h.id, y: window.innerHeight / 2 }); }}
        onExport={exportNotebook}
      />
      <NotesAndTagsSheet open={sheet === 'notes' || sheet === 'tags'} initialTab={sheet === 'tags' ? 'tags' : 'note'} onClose={() => setSheet(null)} note={doc.note ?? ''} tags={doc.tags} onSave={v => patchDoc({ note: v.note, tags: v.tags })} />
      <EditMetadataSheet open={sheet === 'editMeta'} doc={doc} onClose={() => setSheet(null)} onSave={v => patchDoc(v)} />
      <HighlightActionsSheet open={sheet === 'hlActions'} onClose={() => setSheet(null)} highlight={activeHl} autoHighlight={settings.autoHighlight} onToggleAutoHighlight={v => patchSettings({ autoHighlight: v })} />
      {activeHl && <HighlightNoteSheet key={activeHl.id} open={sheet === 'hlNote'} onClose={() => setSheet(null)} note={activeHl.note ?? ''} onSave={saveHighlightNote} />}
      {pending && <button className="hidden" onClick={clearSelection} />}
    </div>
  );
}
