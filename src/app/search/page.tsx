'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, X, Clock, ChevronRight, Trash2, Plus, Filter } from 'lucide-react';
import TabBar from '@/components/app/TabBar';
import DocumentRow from '@/components/app/DocumentRow';
import DocumentActionsSheet from '@/components/app/DocumentActionsSheet';
import HighlightCard, { type BrowseHighlight } from '@/components/review/HighlightCard';
import Sheet, { SheetGroup, SheetRow } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import type { DocumentSummary } from '@/lib/documents';

interface SavedView { id: string; name: string; query: string; pinned: boolean }
interface Results { documents: DocumentSummary[]; highlights: BrowseHighlight[]; snippets: Record<string, string> }

const RECENT_KEY = 'recent-searches';

/** Search tab (docs/ux-spec.md §3.8): field, results with matched words, recent searches, saved views, Trash. */
export default function SearchPage() {
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [views, setViews] = useState<SavedView[]>([]);
  const [active, setActive] = useState<DocumentSummary | null>(null);
  const [viewEditor, setViewEditor] = useState<{ id?: string; name: string; query: string } | null>(null);
  const [viewMenu, setViewMenu] = useState<SavedView | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')); } catch {}
    fetch('/api/views').then(r => r.json()).then(setViews).catch(() => {});
  }, []);

  const remember = (term: string) => {
    const next = [term, ...recent.filter(r => r !== term)].slice(0, 5);
    setRecent(next); try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
  };

  const run = useCallback(async (term: string) => {
    if (term.trim().length < 2) { setResults(null); return; }
    setLoading(true);
    try { const res = await fetch(`/api/search?q=${encodeURIComponent(term.trim())}`); setResults(await res.json()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => run(q), 350);
  }, [q, run]);

  const submit = () => { if (q.trim().length >= 2) remember(q.trim()); };

  const saveView = async () => {
    if (!viewEditor) return;
    const res = await fetch('/api/views', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(viewEditor) });
    const data = await res.json();
    if (!res.ok) { toast(data.error || "Couldn't save view"); return; }
    setViewEditor(null); fetch('/api/views').then(r => r.json()).then(setViews); toast('View saved');
  };
  const deleteView = async (v: SavedView) => {
    await fetch('/api/views', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: v.id, delete: true }) });
    setViewMenu(null); setViews(vs => vs.filter(x => x.id !== v.id)); toast('View deleted');
  };

  const mark = (text: string) => {
    const term = q.trim(); if (!term) return text;
    const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
    return text.split(re).map((part, i) => (re.test(part) ? <mark key={i} className="rounded-sm bg-[rgba(0,114,255,.3)] text-ink-ui">{part}</mark> : part));
  };

  const showResults = q.trim().length >= 2;

  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-28">
      <header className="px-4 pt-safe">
        <div className="h-3" />
        <div className="flex h-9 items-center gap-2 rounded-lg bg-chip px-3">
          <Search size={16} className="text-ink-2" />
          <input
            type="search"
            enterKeyHint="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            placeholder="Search your library"
            className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink-2 focus:outline-none"
          />
          {q && <button onClick={() => setQ('')} aria-label="Clear" className="text-ink-2"><X size={16} /></button>}
        </div>
      </header>

      {!showResults ? (
        <div className="px-4 pt-6">
          {recent.length > 0 && (
            <section className="mb-6">
              <div className="mb-2 flex items-center justify-between"><h2 className="smallcaps text-ink-2">Recent</h2><button onClick={() => { setRecent([]); try { localStorage.removeItem(RECENT_KEY); } catch {} }} className="text-[13px] text-ink-2">Clear</button></div>
              <div className="overflow-hidden rounded-group bg-surface-1">
                {recent.map(r => (
                  <div key={r} className="flex items-center border-t border-bg first:border-t-0">
                    <button onClick={() => setQ(r)} className="flex h-11 flex-1 items-center gap-3 px-4 text-left text-[15px] text-ink"><Clock size={16} className="text-ink-2" />{r}</button>
                    <button onClick={() => { const next = recent.filter(x => x !== r); setRecent(next); try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {} }} aria-label="Remove" className="flex h-11 w-11 items-center justify-center text-ink-2"><X size={14} /></button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mb-6">
            <div className="mb-2 flex items-center justify-between"><h2 className="smallcaps text-ink-2">Saved views</h2><button onClick={() => setViewEditor({ name: '', query: '' })} aria-label="Add view" className="text-ink-2"><Plus size={18} /></button></div>
            <div className="overflow-hidden rounded-group bg-surface-1">
              {views.map(v => (
                <div key={v.id} className="flex items-center border-t border-bg first:border-t-0">
                  <Link href={`/search/view/${v.id}`} className="flex h-11 flex-1 items-center gap-3 px-4 text-[15px] text-ink"><Filter size={16} className="text-ink-2" /><span className="flex-1 truncate">{v.name}</span></Link>
                  <button onClick={() => setViewMenu(v)} aria-label="View options" className="flex h-11 w-11 items-center justify-center text-ink-2"><ChevronRight size={16} /></button>
                </div>
              ))}
            </div>
          </section>

          <div className="overflow-hidden rounded-group bg-surface-1">
            <Link href="/trash" className="flex h-11 items-center gap-3 px-4 text-[15px] text-ink"><Trash2 size={16} className="text-ink-2" /><span className="flex-1">Trash</span><ChevronRight size={16} className="text-ink-2" /></Link>
          </div>
        </div>
      ) : (
        <div className="pt-2">
          {loading && !results && <p className="px-4 py-10 text-center text-[14px] text-ink-2">Searching…</p>}
          {results && results.documents.length === 0 && results.highlights.length === 0 && !loading && <p className="px-4 py-10 text-center text-[14px] text-ink-2">No results for “{q.trim()}”</p>}
          {results?.documents.map(doc => (
            <div key={doc.id} className="relative">
              <DocumentRow doc={{ ...doc, excerpt: results.snippets[doc.id] ?? doc.excerpt }} onMore={setActive} from="/search" />
              <span className="pointer-events-none absolute right-4 top-3 text-[10px] font-medium uppercase tracking-wide text-ink-2">{doc.deletedAt ? 'Trash' : doc.isFeed ? 'Feed' : doc.location}</span>
            </div>
          ))}
          {results && results.highlights.length > 0 && (
            <section className="px-4 pt-4">
              <h2 className="smallcaps mb-3 text-ink-2">Highlights</h2>
              <div className="space-y-3">
                {results.highlights.map(h => <HighlightCard key={h.id} highlight={{ ...h, text: h.text }} compact />)}
              </div>
            </section>
          )}
          {results && <p className="px-4 pb-4 pt-6 text-right text-[12px] text-ink-2">Count: {results.documents.length + results.highlights.length}</p>}
          <span className="hidden">{results?.documents.map(d => mark(d.title))}</span>
        </div>
      )}

      <TabBar />
      <DocumentActionsSheet doc={active} onClose={() => setActive(null)} onChanged={() => run(q)} />

      <Sheet open={!!viewMenu} onClose={() => setViewMenu(null)} title={viewMenu?.name}>
        <p className="mb-3 px-1 font-mono text-[12px] text-ink-2">{viewMenu?.query}</p>
        <SheetGroup>
          <SheetRow label="Edit view" onClick={() => { if (viewMenu) setViewEditor({ id: viewMenu.id, name: viewMenu.name, query: viewMenu.query }); setViewMenu(null); }} />
        </SheetGroup>
        <SheetGroup><SheetRow label="Delete view" danger onClick={() => viewMenu && deleteView(viewMenu)} /></SheetGroup>
      </Sheet>

      <Sheet open={!!viewEditor} onClose={() => setViewEditor(null)} title={viewEditor?.id ? 'Edit view' : 'New view'} left={<button onClick={() => setViewEditor(null)}>Cancel</button>} right={<button onClick={saveView} className="font-medium text-accent">Save</button>}>
        {viewEditor && (
          <>
            <label className="mb-1 block text-[12px] uppercase tracking-wide text-ink-2">Name</label>
            <input value={viewEditor.name} onChange={e => setViewEditor({ ...viewEditor, name: e.target.value })} placeholder="⏱ Quick reads" className="mb-4 h-11 w-full rounded-group bg-surface-group px-3 text-[16px] text-ink placeholder:text-ink-2 focus:outline-none" />
            <label className="mb-1 block text-[12px] uppercase tracking-wide text-ink-2">Query</label>
            <input value={viewEditor.query} onChange={e => setViewEditor({ ...viewEditor, query: e.target.value })} placeholder='tag:design AND minutes__lt:10' className="h-11 w-full rounded-group bg-surface-group px-3 font-mono text-[14px] text-ink placeholder:text-ink-2 focus:outline-none" />
            <p className="mt-3 text-[12px] leading-5 text-ink-2">Fields: tag, domain, author, title, type, in (inbox/archive), feed, seen, saved, published, last_opened, minutes, words, progress, has (highlights/tags/notes). Operators: __gt __lt __after __before __contains __not. Combine with AND, OR and ( ).</p>
          </>
        )}
      </Sheet>
    </div>
  );
}
