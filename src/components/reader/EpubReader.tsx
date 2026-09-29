'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ePub, { type Book, type Rendition, type Contents, type NavItem } from 'epubjs';
import type { ReaderProps, TocItem } from '@/lib/reader-types';
import { FONT_OPTIONS } from '@/lib/reader-types';
import { HIGHLIGHT_COLORS } from '@/lib/colors';

const hue = (id: string) => HIGHLIGHT_COLORS.find(c => c.id === id)?.hue ?? 50;

/**
 * Long-form EPUB reader on epubjs (docs/ux-spec.md §3.5): paged, tap margins to turn,
 * tap the centre to show bars, highlights as tinted rects + underline in the chosen colour.
 */
export default function EpubReader(p: ReaderProps) {
  const holder = useRef<HTMLDivElement>(null);
  const bookRef = useRef<Book | null>(null);
  const rendRef = useRef<Rendition | null>(null);
  const contentsRef = useRef<Contents | null>(null);
  const propsRef = useRef(p); propsRef.current = p;
  const [ready, setReady] = useState(false);
  const findState = useRef<{ cfis: string[]; index: number }>({ cfis: [], index: 0 });

  // ── Boot ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!holder.current || !p.doc.filePath) return;
    const book = ePub(p.doc.filePath);
    bookRef.current = book;
    const rendition = book.renderTo(holder.current, { width: '100%', height: '100%', flow: 'paginated', spread: 'none', allowScriptedContent: false });
    rendRef.current = rendition;

    rendition.themes.register('app', {
      body: { background: '#000 !important', color: '#c1c7ce !important', 'padding-top': '56px !important', 'padding-bottom': '24px !important' },
      'p, li, div, span': { color: 'inherit' },
      'h1, h2, h3, h4, h5, h6': { color: '#f0f1f2 !important' },
      a: { color: '#b9a8f5 !important' },
      img: { 'max-width': '100% !important', height: 'auto !important' },
      '::selection': { background: 'rgba(70,147,254,.35)' },
      '.tts-para': { background: 'rgba(70,147,254,.10)', 'border-radius': '6px' },
    });
    rendition.themes.select('app');

    let startCfi: string | undefined;
    try { const pos = p.doc.position ? JSON.parse(p.doc.position) : null; startCfi = pos?.cfi; } catch {}
    rendition.display(startCfi).then(() => setReady(true));

    book.loaded.navigation.then(nav => {
      const items: TocItem[] = [];
      const walk = (list: NavItem[], level: number) => list.forEach(n => { items.push({ id: n.href, label: n.label.trim(), level, target: n.href }); if (n.subitems?.length) walk(n.subitems, level + 1); });
      walk(nav.toc, 1);
      propsRef.current.onToc(items);
    });
    book.ready.then(() => book.locations.generate(1200));

    rendition.on('rendered', (_section: unknown, contents: Contents) => {
      contentsRef.current = contents;
      const doc = contents.document;
      // paragraph ids for Listen
      let i = 0; doc.querySelectorAll('p, li, h1, h2, h3, h4, blockquote').forEach(el => { if (el.textContent?.trim()) (el as HTMLElement).dataset.paraId = `p${i++}`; });
      // tap handling: margins turn pages, centre toggles bars, highlights select
      doc.addEventListener('click', (e: MouseEvent) => {
        const sel = contents.window.getSelection();
        if (sel && !sel.isCollapsed) return;
        if ((e.target as HTMLElement).closest('a')) return;
        const w = contents.window.innerWidth; const x = e.clientX % w;
        if (x < w * 0.2) { rendition.prev(); return; }
        if (x > w * 0.8) { rendition.next(); return; }
        propsRef.current.onActive(null); propsRef.current.onTap();
      });
      doc.addEventListener('selectionchange', () => {
        const sel = contents.window.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) { propsRef.current.onPending(null); return; }
      });
    });

    rendition.on('selected', (cfiRange: string, contents: Contents) => {
      const sel = contents.window.getSelection(); const text = sel?.toString().trim();
      if (!text) return;
      const rect = sel!.getRangeAt(0).getBoundingClientRect();
      const frameTop = holder.current?.getBoundingClientRect().top ?? 0;
      propsRef.current.onPending({ text, position: { cfi: cfiRange }, y: frameTop + rect.top + rect.height / 2 });
    });

    rendition.on('relocated', (loc: { start: { cfi: string; percentage?: number; href: string }; end: { percentage?: number } }) => {
      const pct = book.locations.length() ? book.locations.percentageFromCfi(loc.start.cfi) : (loc.end?.percentage ?? loc.start.percentage ?? 0);
      propsRef.current.onProgress(Math.min(1, pct || 0), { cfi: loc.start.cfi, ratio: pct });
      propsRef.current.onCurrentToc(loc.start.href);
    });

    rendition.on('keydown', (e: KeyboardEvent) => { if (e.key === 'ArrowRight') rendition.next(); if (e.key === 'ArrowLeft') rendition.prev(); });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') rendition.next(); if (e.key === 'ArrowLeft') rendition.prev(); };
    window.addEventListener('keydown', onKey);

    return () => { window.removeEventListener('keydown', onKey); rendition.destroy(); book.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.doc.filePath]);

  // ── Appearance ──────────────────────────────────────────────────────────
  useEffect(() => {
    const r = rendRef.current; if (!r) return;
    const font = FONT_OPTIONS.find(f => f.id === p.settings.readerFont) ?? FONT_OPTIONS[0];
    r.themes.font(font.css.replace(/var\([^)]+\),\s*/, ''));
    r.themes.fontSize(`${p.settings.readerFontSize}px`);
    r.themes.override('line-height', String(p.settings.readerLineHeight));
  }, [p.settings.readerFont, p.settings.readerFontSize, p.settings.readerLineHeight, ready]);

  // ── Highlights ──────────────────────────────────────────────────────────
  useEffect(() => {
    const r = rendRef.current; if (!r || !ready) return;
    const drawn = new Set<string>();
    for (const h of p.highlights) {
      if (h.kind !== 'text' || !h.position) continue;
      let cfi: string; try { cfi = JSON.parse(h.position).cfi; } catch { continue; }
      if (!cfi) continue;
      drawn.add(cfi);
      const active = h.id === p.activeHighlightId;
      try {
        r.annotations.remove(cfi, 'highlight'); r.annotations.remove(cfi, 'underline');
        r.annotations.highlight(cfi, { id: h.id }, (e: MouseEvent) => {
          e.stopPropagation();
          const frameTop = holder.current?.getBoundingClientRect().top ?? 0;
          propsRef.current.onActive({ id: h.id, y: frameTop + e.clientY });
        }, `hl-${h.color}`, { fill: `hsl(${hue(h.color)} 100% 50%)`, 'fill-opacity': active ? '0.38' : '0.22', stroke: 'none', 'mix-blend-mode': 'normal' });
        r.annotations.underline(cfi, { id: h.id }, undefined, `ul-${h.color}`, { stroke: `hsl(${hue(h.color)} 100% 50%)`, 'stroke-opacity': '0.8', 'stroke-width': '2' });
      } catch { /* cfi not in this section yet */ }
    }
    return () => { drawn.forEach(cfi => { try { r.annotations.remove(cfi, 'highlight'); r.annotations.remove(cfi, 'underline'); } catch {} }); };
  }, [p.highlights, p.activeHighlightId, ready]);

  // ── Handle ──────────────────────────────────────────────────────────────
  const handle = useMemo(() => ({
    jumpTo: (target: string | number) => { rendRef.current?.display(String(target)); },
    getParagraphs: () => [...(contentsRef.current?.document.querySelectorAll<HTMLElement>('[data-para-id]') ?? [])].map(el => ({ id: el.dataset.paraId!, text: el.textContent?.replace(/\s+/g, ' ').trim() ?? '' })),
    scrollToParagraph: (id: string) => {
      const c = contentsRef.current; const el = c?.document.querySelector<HTMLElement>(`[data-para-id="${id}"]`); if (!c || !el) return;
      try { rendRef.current?.display(c.cfiFromNode(el)); } catch {}
    },
    setSpokenRange: (id: string | null, start?: number, end?: number) => {
      const c = contentsRef.current; if (!c) return;
      c.document.querySelectorAll('.tts-para').forEach(e => e.classList.remove('tts-para'));
      const cssH = (c.window as Window).CSS?.highlights; cssH?.delete('tts-word');
      if (!id) return;
      const el = c.document.querySelector<HTMLElement>(`[data-para-id="${id}"]`); if (!el) return;
      el.classList.add('tts-para');
      if (start === undefined || end === undefined || !cssH) return;
      const raw = el.textContent ?? ''; let n = 0, rs = -1, re = -1, prevSpace = true;
      for (let i = 0; i < raw.length; i++) { const sp = /\s/.test(raw[i]); if (sp && prevSpace) continue; if (n === start && rs < 0) rs = i; n++; prevSpace = sp; if (n === end) { re = i + 1; break; } }
      if (rs < 0 || re < 0) return;
      const walker = c.document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const range = c.document.createRange(); let acc = 0, ok = false, node: Node | null;
      while ((node = walker.nextNode())) { const len = (node as Text).data.length; if (!ok && rs >= acc && rs <= acc + len) { range.setStart(node, rs - acc); ok = true; } if (ok && re >= acc && re <= acc + len) { range.setEnd(node, re - acc); cssH.set('tts-word', new (c.window as Window & { Highlight: typeof Highlight }).Highlight(range)); return; } acc += len; }
    },
    returnToProgress: () => { const b = bookRef.current; if (!b) return; const cfi = b.locations.cfiFromPercentage(p.doc.progress); if (cfi) rendRef.current?.display(cfi); },
    find: (query: string) => {
      const q = query.trim(); findState.current = { cfis: [], index: 0 }; if (!q || !bookRef.current) return 0;
      // Search the current section only (searching every section is slow on big books).
      const section = contentsRef.current && bookRef.current.spine.get(contentsRef.current.sectionIndex);
      const results = section ? (section as unknown as { find: (q: string) => { cfi: string }[] }).find(q) : [];
      findState.current = { cfis: results.map(r => r.cfi), index: 0 };
      if (results[0]) rendRef.current?.display(results[0].cfi);
      return results.length;
    },
    findNext: (dir: 1 | -1) => { const s = findState.current; if (!s.cfis.length) return 0; s.index = (s.index + dir + s.cfis.length) % s.cfis.length; rendRef.current?.display(s.cfis[s.index]); return s.index; },
  }), [p.doc.progress]);
  useEffect(() => { p.registerHandle(handle); }, [handle, p]);

  return (
    <div className="fixed inset-0 bg-reader-bg">
      <div ref={holder} className="h-full w-full" />
      {!ready && <p className="absolute inset-x-0 top-1/2 text-center text-[14px] text-ink-2">Opening book…</p>}
    </div>
  );
}
