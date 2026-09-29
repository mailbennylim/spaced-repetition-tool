'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ReaderProps, TocItem } from '@/lib/reader-types';
import { FONT_OPTIONS, LINE_WIDTHS } from '@/lib/reader-types';
import { rangeToOffsets, resolvePosition, wrapRange, unwrapAll, offsetsToRange, type TextPosition } from '@/lib/text-anchor';
import { readingMinutes, formatMinutes, rowDate } from '@/lib/format';
import { Favicon, typeLabel } from '@/components/ui/Icons';

const BLOCKS = 'p, li, blockquote, h1, h2, h3, h4, h5, h6, pre, figcaption, dd, td';

declare global {
  interface Window { CSS: typeof CSS & { highlights?: Map<string, Highlight> } }
}

/** Short-form reader for articles, emails and RSS items (docs/ux-spec.md §3.5). */
export default function ArticleReader(p: ReaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const highlightsRef = useRef(p.highlights);
  highlightsRef.current = p.highlights;
  const findState = useRef<{ ranges: Range[]; index: number }>({ ranges: [], index: 0 });
  const restored = useRef(false);

  const font = FONT_OPTIONS.find(f => f.id === p.settings.readerFont) ?? FONT_OPTIONS[0];
  const maxWidth = LINE_WIDTHS[p.settings.readerLineWidth] ?? LINE_WIDTHS.medium;
  // Stable object: React re-sets innerHTML (destroying highlights and the selection) if this identity changes.
  const html = useMemo(() => ({ __html: p.doc.content || '<p>No content.</p>' }), [p.doc.content]);

  // ── Paragraph + heading ids (once per content) ──────────────────────────
  useEffect(() => {
    const root = contentRef.current; if (!root) return;
    let pi = 0, hi = 0;
    const toc: TocItem[] = [];
    root.querySelectorAll<HTMLElement>(BLOCKS).forEach(el => {
      if (el.querySelector(BLOCKS)) return; // only leaf blocks
      if (!el.textContent?.trim()) return;
      el.dataset.paraId = `p${pi++}`;
    });
    root.querySelectorAll<HTMLElement>('h1, h2, h3, h4').forEach(el => {
      const label = el.textContent?.trim(); if (!label) return;
      el.id = el.id || `h__${hi++}`;
      toc.push({ id: el.id, label, level: Number(el.tagName[1]) <= 2 ? 1 : 2, target: el.id });
    });
    p.onToc(toc);
    // Make links open outside the app
    root.querySelectorAll('a[href]').forEach(a => { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.doc.content]);

  // Current heading for the Contents sheet
  useEffect(() => {
    const root = contentRef.current; if (!root) return;
    const heads = [...root.querySelectorAll<HTMLElement>('h1, h2, h3, h4')];
    if (!heads.length) return;
    const io = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) p.onCurrentToc((visible.target as HTMLElement).id);
    }, { rootMargin: '-10% 0px -70% 0px' });
    heads.forEach(h => io.observe(h));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.doc.content]);

  // ── Draw highlights ─────────────────────────────────────────────────────
  useEffect(() => {
    const root = contentRef.current; if (!root) return;
    unwrapAll(root, 'span.hl[data-hl]');
    for (const h of p.highlights) {
      if (h.kind !== 'text' || !h.position) continue;
      let pos: TextPosition; try { pos = JSON.parse(h.position); } catch { continue; }
      if (typeof pos.start !== 'number') continue;
      const range = resolvePosition(root, pos); if (!range) continue;
      wrapRange(range, () => {
        const s = document.createElement('span');
        s.className = `hl hl-${h.color}${h.id === p.activeHighlightId ? ' hl-active' : ''}`;
        s.dataset.hl = h.id;
        return s;
      });
    }
  }, [p.highlights, p.activeHighlightId, p.doc.content]);

  // ── Selection → pending ─────────────────────────────────────────────────
  const readSelection = useCallback(() => {
    const root = contentRef.current; if (!root) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) { p.onPending(null); return; }
    const range = sel.getRangeAt(0);
    if (!root.contains(range.commonAncestorContainer)) { p.onPending(null); return; }
    const text = range.toString().trim(); if (!text) { p.onPending(null); return; }
    const pos = rangeToOffsets(root, range); if (!pos) return;
    const rect = range.getBoundingClientRect();
    p.onPending({ text, position: pos, y: rect.top + rect.height / 2 });
  }, [p]);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const onChange = () => { clearTimeout(t); t = setTimeout(readSelection, 250); };
    document.addEventListener('selectionchange', onChange);
    return () => { document.removeEventListener('selectionchange', onChange); clearTimeout(t); };
  }, [readSelection]);

  // ── Taps ────────────────────────────────────────────────────────────────
  const onClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const hl = target.closest<HTMLElement>('span.hl[data-hl]');
    if (hl) {
      e.preventDefault();
      const rect = hl.getBoundingClientRect();
      p.onActive({ id: hl.dataset.hl!, y: rect.top + rect.height / 2 });
      return;
    }
    if (target.closest('a, button, img, video')) return;
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;
    p.onActive(null);
    p.onTap();
  };

  // ── Progress + restore ──────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - window.innerHeight;
      const ratio = max <= 0 ? 1 : Math.min(1, window.scrollY / max);
      p.onProgress(ratio, { ratio, scrollY: window.scrollY });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [p]);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    let ratio = 0;
    try { const pos = p.doc.position ? JSON.parse(p.doc.position) : null; ratio = typeof pos?.ratio === 'number' ? pos.ratio : 0; } catch {}
    if (ratio > 0.01) {
      const go = () => { const h = document.documentElement; window.scrollTo({ top: ratio * (h.scrollHeight - window.innerHeight) }); };
      setTimeout(go, 50); setTimeout(go, 400);
    }
  }, [p.doc.position]);

  // ── Handle for the chrome / Listen / Find ───────────────────────────────
  const handle = useMemo(() => ({
    jumpTo: (target: string | number) => { const el = document.getElementById(String(target)); el?.scrollIntoView({ block: 'start', behavior: 'smooth' }); },
    getParagraphs: () => [...(contentRef.current?.querySelectorAll<HTMLElement>('[data-para-id]') ?? [])].map(el => ({ id: el.dataset.paraId!, text: el.textContent?.replace(/\s+/g, ' ').trim() ?? '' })),
    scrollToParagraph: (id: string) => { const el = contentRef.current?.querySelector<HTMLElement>(`[data-para-id="${id}"]`); if (!el) return; const r = el.getBoundingClientRect(); if (r.top < 80 || r.bottom > window.innerHeight - 200) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); },
    setSpokenRange: (id: string | null, start?: number, end?: number) => {
      contentRef.current?.querySelectorAll('.tts-para').forEach(e => e.classList.remove('tts-para'));
      window.CSS.highlights?.delete('tts-word');
      if (!id) return;
      const el = contentRef.current?.querySelector<HTMLElement>(`[data-para-id="${id}"]`); if (!el) return;
      el.classList.add('tts-para');
      if (start === undefined || end === undefined || !window.CSS.highlights) return;
      // Offsets are over the normalised text; map back through the raw text (collapse runs of whitespace).
      const raw = el.textContent ?? ''; let n = 0, rs = -1, re = -1, prevSpace = true;
      for (let i = 0; i < raw.length; i++) {
        const ch = raw[i], space = /\s/.test(ch);
        if (space && prevSpace) continue;
        if (n === start && rs < 0) rs = i;
        n++; prevSpace = space;
        if (n === end) { re = i + 1; break; }
      }
      if (rs < 0 || re < 0) return;
      const range = offsetsToRange(el, rs, re); if (!range) return;
      window.CSS.highlights.set('tts-word', new Highlight(range));
    },
    returnToProgress: () => { const h = document.documentElement; window.scrollTo({ top: p.doc.progress * (h.scrollHeight - window.innerHeight), behavior: 'smooth' }); },
    find: (query: string) => {
      const root = contentRef.current; const cssH = window.CSS.highlights;
      cssH?.delete('find-match'); cssH?.delete('find-current');
      findState.current = { ranges: [], index: 0 };
      const q = query.trim().toLowerCase(); if (!root || !q) return 0;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const nodes: Text[] = []; let n: Node | null;
      while ((n = walker.nextNode())) nodes.push(n as Text);
      const full = nodes.map(t => t.data).join('').toLowerCase();
      const ranges: Range[] = []; let i = full.indexOf(q);
      while (i >= 0 && ranges.length < 500) { const r = offsetsToRange(root, i, i + q.length); if (r) ranges.push(r); i = full.indexOf(q, i + q.length); }
      findState.current = { ranges, index: 0 };
      if (cssH && ranges.length) { cssH.set('find-match', new Highlight(...ranges)); cssH.set('find-current', new Highlight(ranges[0])); ranges[0].startContainer.parentElement?.scrollIntoView({ block: 'center' }); }
      return ranges.length;
    },
    findNext: (dir: 1 | -1) => {
      const s = findState.current; if (!s.ranges.length) return 0;
      s.index = (s.index + dir + s.ranges.length) % s.ranges.length;
      window.CSS.highlights?.set('find-current', new Highlight(s.ranges[s.index]));
      s.ranges[s.index].startContainer.parentElement?.scrollIntoView({ block: 'center' });
      return s.index;
    },
  }), [p.doc.progress]);
  useEffect(() => { p.registerHandle(handle); }, [handle, p]);

  const mins = readingMinutes(p.doc.wordCount);

  return (
    <div ref={rootRef} className="min-h-dvh bg-reader-bg pb-40 pt-[calc(var(--safe-top)+72px)]" onClick={onClick}>
      <article className="mx-auto px-5" style={{ maxWidth }}>
        {p.doc.domain && (
          <a href={p.doc.url ?? undefined} target="_blank" rel="noopener" className="mb-3 inline-flex items-center gap-2 text-[14px] text-ink-2">
            <Favicon domain={p.doc.domain} /><span className="uppercase tracking-wide">{p.doc.domain}</span>
          </a>
        )}
        {!p.doc.domain && <p className="mb-3 text-[12px] uppercase tracking-wide text-ink-2">{typeLabel(p.doc.type)}</p>}
        <h1 className="font-serif text-[30px] font-bold leading-9 tracking-[-0.6px] text-ink">{p.doc.title}</h1>
        <p className="mb-6 mt-3 flex flex-wrap items-center gap-x-1.5 text-[14px] text-ink-2">
          {p.doc.author && <span>{p.doc.author}</span>}
          {p.doc.author && mins && <span>•</span>}
          {mins && <span>{formatMinutes(mins)}</span>}
          {p.doc.tags.map(t => <span key={t} className="rounded bg-chip px-1.5 text-[12px] leading-5 text-ink-ui">{t}</span>)}
          {p.doc.publishedAt && <span className="ml-auto">{rowDate(p.doc.publishedAt)}</span>}
        </p>
        <div
          ref={contentRef}
          className="reader-prose select-text"
          style={{ fontFamily: font.css, fontSize: p.settings.readerFontSize, lineHeight: p.settings.readerLineHeight }}
          dangerouslySetInnerHTML={html}
        />
      </article>
    </div>
  );
}
