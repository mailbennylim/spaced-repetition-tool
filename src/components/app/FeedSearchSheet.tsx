'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Plus, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Sheet from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';

interface Candidate {
  title: string; url: string; siteUrl?: string | null; description?: string | null; iconUrl?: string | null;
  subscribers?: number | null; lastUpdated?: string | null; source: string; subscribed: boolean;
}

function popularity(n?: number | null): string | null {
  if (!n) return null;
  if (n >= 10000) return 'Very popular';
  if (n >= 1000) return 'Popular';
  if (n >= 100) return 'Somewhat popular';
  return null;
}

/** Subscribe to RSS feed (docs/ux-spec.md §3.3.1): search by name or paste a site address, tap ⊕ to subscribe. */
export default function FeedSearchSheet({ open, onClose, onSubscribed }: { open: boolean; onClose: () => void; onSubscribed: () => void }) {
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!q.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    const mine = ++seq.current;
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/feeds/search?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        if (mine === seq.current) setResults(data);
      } finally { if (mine === seq.current) setLoading(false); }
    }, 450);
  }, [q]);

  useEffect(() => { if (!open) { setQ(''); setResults([]); } }, [open]);

  const toggle = async (c: Candidate) => {
    setBusy(c.url);
    try {
      if (c.subscribed) {
        const feeds = await fetch('/api/feeds').then(r => r.json());
        const f = feeds.find((x: { url: string }) => x.url.replace(/\/$/, '') === c.url.replace(/\/$/, ''));
        if (f) await fetch(`/api/feeds/${f.id}`, { method: 'DELETE' });
        setResults(rs => rs.map(r => (r.url === c.url ? { ...r, subscribed: false } : r)));
        toast(`Unsubscribed from ${c.title}`);
      } else {
        const res = await fetch('/api/feeds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed');
        setResults(rs => rs.map(r => (r.url === c.url ? { ...r, subscribed: true } : r)));
        toast(`Subscribed to ${c.title}`);
      }
      onSubscribed();
    } catch (e) { toast(e instanceof Error ? e.message : "Couldn't subscribe"); }
    finally { setBusy(null); }
  };

  return (
    <Sheet open={open} onClose={onClose} tall left={<span />} right={<button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-group text-ink"><X size={16} /></button>}>
      <div className="-mt-9 mb-3 flex h-11 items-center gap-2 rounded-group bg-surface-group px-3">
        <Search size={18} className="text-ink-2" />
        <input
          autoFocus
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Start typing the name or URL of your RSS feed"
          className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink-2 focus:outline-none"
        />
        {q && <button onClick={() => setQ('')} className="text-[13px] text-ink-2">Clear</button>}
      </div>

      {q.trim() && <p className="smallcaps mb-2 px-1 text-ink-2">Feeds</p>}
      {loading && results.length === 0 && <p className="px-1 py-6 text-center text-[14px] text-ink-2">Searching…</p>}
      {!loading && q.trim() && results.length === 0 && <p className="px-1 py-6 text-center text-[14px] text-ink-2">No feeds found. Try the site&apos;s address, e.g. example.com</p>}
      {!q.trim() && <p className="px-1 py-6 text-center text-[14px] text-ink-2">Search by name, or paste a website or feed address.</p>}

      <ul className="space-y-1">
        {results.map(c => {
          const pop = popularity(c.subscribers);
          const updated = c.lastUpdated ? `Updated ${formatDistanceToNow(new Date(c.lastUpdated), { addSuffix: true })}` : null;
          const host = (() => { try { return new URL(c.url).host.replace(/^www\./, '') + new URL(c.url).pathname.replace(/\/$/, ''); } catch { return c.url; } })();
          const words = q.trim().split(/\s+/).filter(Boolean);
          const mark = (s: string) => { const re = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'ig'); return s.split(re).map((part, i) => (re.test(part) ? <b key={i} className="text-ink">{part}</b> : part)); };
          return (
            <li key={c.url} className="flex gap-3 rounded-group px-1 py-2.5">
              <button onClick={() => toggle(c)} disabled={busy === c.url} aria-label={c.subscribed ? 'Unsubscribe' : 'Subscribe'} className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${c.subscribed ? 'bg-accent text-bg' : 'bg-surface-active text-ink'}`}>
                {c.subscribed ? <Check size={14} /> : <Plus size={14} />}
              </button>
              {c.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.iconUrl} alt="" className="mt-0.5 h-5 w-5 shrink-0 rounded-sm object-cover" />
              ) : <span className="mt-0.5 h-5 w-5 shrink-0 rounded-sm bg-surface-group" />}
              <div className="min-w-0 flex-1">
                <p className="text-[15px] leading-5 text-ink-ui">{words.length ? mark(c.title) : c.title}</p>
                {c.description && <p className="truncate text-[13px] text-ink-2">{c.description}</p>}
                <p className="truncate text-[12px] text-ink-3">{[pop, updated, host].filter(Boolean).join(' • ')}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
