'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Copy, GripVertical, Check } from 'lucide-react';
import ListHeader from '@/components/app/ListHeader';
import TabBar from '@/components/app/TabBar';
import Sheet, { SheetGroup, SheetRow, Switch } from '@/components/ui/Sheet';
import FeedSearchSheet from '@/components/app/FeedSearchSheet';
import { useToast } from '@/components/ui/Toast';
import { HIGHLIGHT_COLORS, colorSolid } from '@/lib/colors';
import { HOME_ROWS } from '@/lib/home-rows';
import { FONT_OPTIONS } from '@/lib/reader-types';

interface Settings {
  notificationTime: string; notificationsEnabled: boolean; dailyHighlightsCount: number; homeRows: string | null;
  autoAdvance: boolean; autoHighlight: boolean; defaultColor: string; readerFont: string; readerFontSize: number;
  ttsVoice: string | null; ttsRate: number; libraryEmailToken: string | null; feedEmailToken: string | null;
}

type Panel = 'home' | 'reading' | 'library' | 'feed' | 'listen' | 'review' | 'import' | 'export' | null;

/** Settings (docs/ux-spec.md §3.9): grouped rows, each opening a sheet. */
export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [s, setS] = useState<Settings | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [feedSearch, setFeedSearch] = useState(false);
  const [rows, setRows] = useState<{ id: string; on: boolean }[]>([]);
  const [voices, setVoices] = useState<string[]>([]);
  const opmlRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [emailDomain, setEmailDomain] = useState('');

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then((d: Settings) => {
      setS(d);
      const saved: string[] | null = d.homeRows ? JSON.parse(d.homeRows) : null;
      const order = saved ?? HOME_ROWS.map(r => r.id);
      setRows([...order.map(id => ({ id, on: true })), ...HOME_ROWS.filter(r => !order.includes(r.id)).map(r => ({ id: r.id, on: false }))]);
    }).catch(() => {});
    fetch('/api/settings/email').then(r => r.json()).then(d => setEmailDomain(d.domain)).catch(() => {});
    if (typeof speechSynthesis !== 'undefined') {
      const load = () => setVoices(speechSynthesis.getVoices().filter(v => v.lang.startsWith('en')).map(v => v.name));
      load(); speechSynthesis.onvoiceschanged = load;
    }
  }, []);

  const patch = async (data: Partial<Settings> | Record<string, unknown>) => {
    setS(prev => (prev ? { ...prev, ...(data as Partial<Settings>) } : prev));
    await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  };
  const saveRows = (next: { id: string; on: boolean }[]) => { setRows(next); patch({ homeRows: next.filter(r => r.on).map(r => r.id) }); };
  const moveRow = (i: number, dir: -1 | 1) => { const next = [...rows]; const j = i + dir; if (j < 0 || j >= next.length) return; [next[i], next[j]] = [next[j], next[i]]; saveRows(next); };
  const copy = async (text: string) => { await navigator.clipboard.writeText(text); toast('Copied'); };

  const importOpml = async (file?: File) => {
    if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    const d = await fetch('/api/feeds/import', { method: 'POST', body: fd }).then(r => r.json());
    toast(d.error ? d.error : `Subscribed to ${d.added} of ${d.found} feeds`);
  };
  const upload = async (file?: File) => {
    if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch('/api/documents', { method: 'POST', body: fd }); const d = await res.json();
    toast(res.ok ? 'Saved to Inbox' : d.error || 'Upload failed');
  };
  const exportAll = async (format: 'md' | 'csv') => {
    window.location.href = `/api/export?format=${format}`;
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const bookmarklet = `javascript:(function(){var u=encodeURIComponent(location.href),t=encodeURIComponent(document.title);var w=window.open('${origin}/save?url='+u+'&title='+t,'reader_save','width=420,height=560');if(!w)location.href='${origin}/save?url='+u;})();`;
  const libraryEmail = s?.libraryEmailToken ? `${s.libraryEmailToken}@library.${emailDomain || 'your-domain'}` : null;
  const feedEmail = s?.feedEmailToken ? `${s.feedEmailToken}@feed.${emailDomain || 'your-domain'}` : null;

  const Row = ({ label, value, onClick }: { label: string; value?: string; onClick: () => void }) => (
    <button onClick={onClick} className="flex h-12 w-full items-center gap-3 border-t border-bg px-4 text-left first:border-t-0">
      <span className="flex-1 text-[16px] text-ink">{label}</span>
      {value && <span className="max-w-[45%] truncate text-[14px] text-ink-2">{value}</span>}
      <ChevronRight size={16} className="text-ink-2" />
    </button>
  );

  if (!s) return <div className="min-h-dvh bg-bg" />;

  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-28">
      <ListHeader title="Settings" onBack={() => router.back()} />
      <div className="space-y-5 px-4">
        <div className="overflow-hidden rounded-group bg-surface-1">
          <Row label="Home" value={`${rows.filter(r => r.on).length} rows`} onClick={() => setPanel('home')} />
          <Row label="Reading" value={s.autoHighlight ? 'Auto-highlight on' : 'Auto-highlight off'} onClick={() => setPanel('reading')} />
          <Row label="Listen" value={`${s.ttsRate}×`} onClick={() => setPanel('listen')} />
        </div>
        <div className="overflow-hidden rounded-group bg-surface-1">
          <Row label="Add to Library" onClick={() => setPanel('library')} />
          <Row label="Add to Feed" onClick={() => setPanel('feed')} />
        </div>
        <div className="overflow-hidden rounded-group bg-surface-1">
          <Row label="Review" value={`${s.dailyHighlightsCount} / day · ${s.notificationsEnabled ? s.notificationTime : 'reminders off'}`} onClick={() => setPanel('review')} />
        </div>
        <div className="overflow-hidden rounded-group bg-surface-1">
          <Row label="Import from Readwise" onClick={() => router.push('/settings/import')} />
          <Row label="Export" onClick={() => setPanel('export')} />
        </div>
        <p className="px-1 text-[12px] text-ink-3">Dark mode only. No AI features.</p>
      </div>
      <TabBar />

      {/* Home rows */}
      <Sheet open={panel === 'home'} onClose={() => setPanel(null)} title="Home">
        <p className="mb-2 px-1 text-[12px] text-ink-2">Choose which rows show on Home and their order.</p>
        <SheetGroup>
          {rows.map((r, i) => {
            const def = HOME_ROWS.find(x => x.id === r.id)!;
            return (
              <div key={r.id} className="flex h-12 items-center gap-2 border-t border-[#1d2329] px-3 first:border-t-0">
                <button onClick={() => saveRows(rows.map(x => (x.id === r.id ? { ...x, on: !x.on } : x)))} aria-label="Toggle" className={`flex h-5 w-5 items-center justify-center rounded border ${r.on ? 'border-accent bg-accent text-bg' : 'border-ink-3'}`}>{r.on && <Check size={12} />}</button>
                <span className={`flex-1 text-[15px] ${r.on ? 'text-ink' : 'text-ink-3'}`}>{def.title}</span>
                <button onClick={() => moveRow(i, -1)} aria-label="Move up" className="px-1 text-ink-2">↑</button>
                <button onClick={() => moveRow(i, 1)} aria-label="Move down" className="px-1 text-ink-2">↓</button>
                <GripVertical size={16} className="text-ink-3" />
              </div>
            );
          })}
        </SheetGroup>
      </Sheet>

      {/* Reading */}
      <Sheet open={panel === 'reading'} onClose={() => setPanel(null)} title="Reading">
        <SheetGroup>
          <SheetRow label={<span>Auto-advance<br /><span className="text-[12px] text-ink-2">Proceed to the next document after taking an action, instead of returning to the list.</span></span>} right={<Switch checked={s.autoAdvance} onChange={v => patch({ autoAdvance: v })} />} />
          <SheetRow label="Auto-highlight" right={<Switch checked={s.autoHighlight} onChange={v => patch({ autoHighlight: v })} />} />
        </SheetGroup>
        <p className="mb-2 px-1 text-[12px] uppercase tracking-wide text-ink-2">Default highlight colour</p>
        <div className="mb-4 flex justify-around rounded-group bg-surface-group py-4">
          {HIGHLIGHT_COLORS.map(c => <button key={c.id} aria-label={c.label} onClick={() => patch({ defaultColor: c.id })} className={`h-9 w-9 rounded-full ${s.defaultColor === c.id ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-group' : ''}`} style={{ background: colorSolid(c.id) }} />)}
        </div>
        <p className="mb-2 px-1 text-[12px] uppercase tracking-wide text-ink-2">Typeface</p>
        <SheetGroup>
          {FONT_OPTIONS.map(f => <SheetRow key={f.id} label={<span style={{ fontFamily: f.css }}>{f.label}</span>} right={s.readerFont === f.id ? <Check size={18} className="text-accent" /> : <span />} onClick={() => patch({ readerFont: f.id })} />)}
        </SheetGroup>
      </Sheet>

      {/* Listen */}
      <Sheet open={panel === 'listen'} onClose={() => setPanel(null)} title="Listen">
        <p className="mb-2 px-1 text-[12px] uppercase tracking-wide text-ink-2">Default speed</p>
        <div className="mb-4 flex gap-2">{[0.75, 1, 1.25, 1.5, 1.75, 2].map(r => <button key={r} onClick={() => patch({ ttsRate: r })} className={`h-10 flex-1 rounded-full text-[14px] ${s.ttsRate === r ? 'bg-surface-active text-ink' : 'bg-surface-group text-ink'}`}>{r}×</button>)}</div>
        <p className="mb-2 px-1 text-[12px] uppercase tracking-wide text-ink-2">Default voice (this device)</p>
        <SheetGroup>
          {voices.length === 0 && <p className="px-4 py-3 text-[14px] text-ink-2">No voices found.</p>}
          {voices.map(v => <SheetRow key={v} label={v.replace(/ \(.*\)$/, '')} right={s.ttsVoice === v ? <Check size={18} className="text-accent" /> : <span />} onClick={() => patch({ ttsVoice: v })} />)}
        </SheetGroup>
      </Sheet>

      {/* Add to Library */}
      <Sheet open={panel === 'library'} onClose={() => setPanel(null)} title="Add to Library">
        <p className="mb-3 px-1 text-[13px] text-ink-2">Library is where documents you save for yourself live.</p>
        <SheetGroup>
          <SheetRow label="Upload file (EPUB, PDF, Markdown)" onClick={() => uploadRef.current?.click()} />
        </SheetGroup>
        <p className="mb-1 px-1 text-[12px] uppercase tracking-wide text-ink-2">Forward email</p>
        <p className="mb-2 px-1 text-[13px] text-ink-2">To import any email to your Inbox, forward it to:</p>
        <div className="mb-4 flex items-center gap-2 rounded-group bg-surface-group px-3 py-2.5">
          <span className="flex-1 truncate font-mono text-[13px] text-ink">{libraryEmail ?? 'Set up in Settings › Email (Mac mini step)'}</span>
          {libraryEmail && <button onClick={() => copy(libraryEmail)} aria-label="Copy"><Copy size={16} className="text-ink-2" /></button>}
        </div>
        <p className="mb-1 px-1 text-[12px] uppercase tracking-wide text-ink-2">Bookmarklet</p>
        <p className="mb-2 px-1 text-[13px] text-ink-2">On a computer, drag this button to your bookmarks bar. Click it on any page to save that page.</p>
        <a href={bookmarklet} onClick={e => { e.preventDefault(); copy(bookmarklet); }} className="inline-block rounded-full bg-accent px-4 py-2 text-[14px] font-semibold text-bg">Save to Reader</a>
        <p className="mt-2 px-1 text-[12px] text-ink-3">Tapping copies the code instead, so you can paste it as a bookmark&apos;s address.</p>
        <input ref={uploadRef} type="file" accept=".epub,.pdf,.md,.markdown,.txt" className="hidden" onChange={e => upload(e.target.files?.[0])} />
      </Sheet>

      {/* Add to Feed */}
      <Sheet open={panel === 'feed' && !feedSearch} onClose={() => setPanel(null)} title="Add to Feed">
        <p className="mb-3 px-1 text-[13px] text-ink-2">Feed is where documents that are automatically pushed to you live.</p>
        <SheetGroup>
          <SheetRow label="Add RSS subscription" onClick={() => setFeedSearch(true)} />
          <SheetRow label="Upload OPML file" onClick={() => opmlRef.current?.click()} />
          <SheetRow label="Manage feeds" onClick={() => router.push('/feed/manage')} />
        </SheetGroup>
        <p className="mb-1 px-1 text-[12px] uppercase tracking-wide text-ink-2">Newsletter address</p>
        <p className="mb-2 px-1 text-[13px] text-ink-2">Subscribe to newsletters with this address and they arrive in Feed:</p>
        <div className="flex items-center gap-2 rounded-group bg-surface-group px-3 py-2.5">
          <span className="flex-1 truncate font-mono text-[13px] text-ink">{feedEmail ?? 'Set up in Settings › Email (Mac mini step)'}</span>
          {feedEmail && <button onClick={() => copy(feedEmail)} aria-label="Copy"><Copy size={16} className="text-ink-2" /></button>}
        </div>
        <input ref={opmlRef} type="file" accept=".opml,.xml" className="hidden" onChange={e => importOpml(e.target.files?.[0])} />
      </Sheet>
      <FeedSearchSheet open={feedSearch} onClose={() => setFeedSearch(false)} onSubscribed={() => {}} />

      {/* Review */}
      <Sheet open={panel === 'review'} onClose={() => setPanel(null)} title="Review">
        <SheetGroup>
          <SheetRow label="Daily reminder" right={<Switch checked={s.notificationsEnabled} onChange={v => patch({ notificationsEnabled: v })} />} />
          <div className="flex h-12 items-center justify-between border-t border-[#1d2329] px-4"><span className="text-[16px] text-ink">Reminder time</span><input type="time" value={s.notificationTime} onChange={e => patch({ notificationTime: e.target.value })} className="rounded bg-surface-active px-2 py-1 text-[14px] text-ink" /></div>
        </SheetGroup>
        <p className="mb-2 px-1 text-[12px] uppercase tracking-wide text-ink-2">Highlights per day</p>
        <div className="flex gap-2">{[5, 10, 15, 20].map(n => <button key={n} onClick={() => patch({ dailyHighlightsCount: n })} className={`h-10 flex-1 rounded-full text-[14px] ${s.dailyHighlightsCount === n ? 'bg-surface-active text-ink' : 'bg-surface-group text-ink'}`}>{n}</button>)}</div>
      </Sheet>

      {/* Export */}
      <Sheet open={panel === 'export'} onClose={() => setPanel(null)} title="Export">
        <SheetGroup>
          <SheetRow label="All highlights as Markdown" onClick={() => exportAll('md')} />
          <SheetRow label="All highlights as CSV" onClick={() => exportAll('csv')} />
        </SheetGroup>
      </Sheet>
    </div>
  );
}
