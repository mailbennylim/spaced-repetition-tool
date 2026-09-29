'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import 'react-pdf/dist/Page/TextLayer.css';
import type { ReaderProps, TocItem } from '@/lib/reader-types';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface Rect { x: number; y: number; w: number; h: number } // fractions of the page box
interface PdfPosition { page: number; rects: Rect[] }
interface Para { id: string; text: string; page: number; box: Rect }

/** Long-form PDF reader (docs/ux-spec.md §3.5): continuous vertical pages, text-layer selection, tinted highlight boxes. */
export default function PdfReader(p: ReaderProps) {
  const propsRef = useRef(p); propsRef.current = p;
  const [numPages, setNumPages] = useState(0);
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState<Set<number>>(new Set([1, 2]));
  const [heights, setHeights] = useState<Record<number, number>>({});
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const pageEls = useRef<Record<number, HTMLDivElement | null>>({});
  const parasRef = useRef<Para[]>([]);
  const [spoken, setSpoken] = useState<{ page: number; box: Rect } | null>(null);
  const findState = useRef<{ hits: { page: number; box: Rect }[]; index: number }>({ hits: [], index: 0 });
  const [findHits, setFindHits] = useState<{ page: number; box: Rect }[]>([]);
  const [findIndex, setFindIndex] = useState(0);
  const restored = useRef(false);

  useEffect(() => {
    const measure = () => setWidth(Math.min(window.innerWidth, 900));
    measure(); window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const positions = useMemo(() => {
    const map = new Map<string, PdfPosition>();
    for (const h of p.highlights) { if (!h.position) continue; try { const pos = JSON.parse(h.position); if (pos.page && pos.rects) map.set(h.id, pos); } catch {} }
    return map;
  }, [p.highlights]);

  // ── Load: outline + paragraphs ──────────────────────────────────────────
  const onLoad = useCallback(async (pdf: PDFDocumentProxy) => {
    pdfRef.current = pdf; setNumPages(pdf.numPages);
    try {
      const outline = await pdf.getOutline();
      const items: TocItem[] = [];
      const walk = async (list: typeof outline, level: number) => {
        for (const it of list ?? []) {
          let page = 1;
          try { const dest = typeof it.dest === 'string' ? await pdf.getDestination(it.dest) : it.dest; if (dest?.[0]) page = (await pdf.getPageIndex(dest[0])) + 1; } catch {}
          items.push({ id: `${page}-${it.title}`, label: it.title, level, target: page });
          if (it.items?.length && level < 3) await walk(it.items, level + 1);
        }
      };
      await walk(outline, 1);
      propsRef.current.onToc(items);
    } catch { propsRef.current.onToc([]); }
    // Paragraphs for Listen: group text items into lines, then paragraphs by vertical gaps.
    const paras: Para[] = []; let id = 0;
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n); const vp = page.getViewport({ scale: 1 }); const tc = await page.getTextContent();
      type Item = { str: string; transform: number[]; width: number; height: number };
      const lines: { y: number; x0: number; x1: number; h: number; text: string }[] = [];
      for (const it of tc.items as Item[]) {
        if (!it.str.trim()) continue;
        const x = it.transform[4], y = vp.height - it.transform[5], h = it.height || 10;
        const last = lines[lines.length - 1];
        if (last && Math.abs(last.y - y) < h * 0.5) { last.text += (it.str.startsWith(' ') || last.text.endsWith(' ') ? '' : ' ') + it.str; last.x1 = Math.max(last.x1, x + it.width); last.x0 = Math.min(last.x0, x); }
        else lines.push({ y, x0: x, x1: x + it.width, h, text: it.str });
      }
      let cur: typeof lines = [];
      const flush = () => {
        if (!cur.length) return;
        const text = cur.map(l => l.text).join(' ').replace(/\s+/g, ' ').trim();
        if (text.length > 2) {
          const top = Math.min(...cur.map(l => l.y - l.h)), bottom = Math.max(...cur.map(l => l.y)), x0 = Math.min(...cur.map(l => l.x0)), x1 = Math.max(...cur.map(l => l.x1));
          paras.push({ id: `p${id++}`, text, page: n, box: { x: x0 / vp.width, y: top / vp.height, w: (x1 - x0) / vp.width, h: (bottom - top) / vp.height } });
        }
        cur = [];
      };
      for (const l of lines) { const prev = cur[cur.length - 1]; if (prev && l.y - prev.y > prev.h * 1.8) flush(); cur.push(l); }
      flush();
    }
    parasRef.current = paras;
  }, []);

  // ── Visibility (render only pages near the viewport) ────────────────────
  useEffect(() => {
    if (!numPages) return;
    const io = new IntersectionObserver(entries => {
      setVisible(prev => {
        const next = new Set(prev);
        entries.forEach(e => { const n = Number((e.target as HTMLElement).dataset.page); if (e.isIntersecting) { next.add(n); next.add(n + 1); next.add(n - 1); } else next.delete(n); });
        return next;
      });
    }, { rootMargin: '800px 0px' });
    Object.values(pageEls.current).forEach(el => el && io.observe(el));
    return () => io.disconnect();
  }, [numPages]);

  // ── Progress + restore ──────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement; const max = h.scrollHeight - window.innerHeight;
      const ratio = max <= 0 ? 1 : Math.min(1, window.scrollY / max);
      let page = 1; for (const [n, el] of Object.entries(pageEls.current)) { if (el && el.getBoundingClientRect().top < window.innerHeight / 2) page = Math.max(page, Number(n)); }
      propsRef.current.onProgress(ratio, { ratio, page });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (restored.current || !numPages) return; restored.current = true;
    try { const pos = p.doc.position ? JSON.parse(p.doc.position) : null; if (pos?.page > 1) setTimeout(() => pageEls.current[pos.page]?.scrollIntoView(), 300); } catch {}
  }, [numPages, p.doc.position]);

  // ── Selection → pending ─────────────────────────────────────────────────
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const read = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) { propsRef.current.onPending(null); return; }
      const range = sel.getRangeAt(0); const text = range.toString().trim(); if (!text) return;
      const pageEl = (range.startContainer.parentElement)?.closest<HTMLElement>('[data-page]'); if (!pageEl) return;
      const page = Number(pageEl.dataset.page); const pr = pageEl.getBoundingClientRect();
      const rects: Rect[] = [];
      for (const r of Array.from(range.getClientRects())) {
        if (r.width < 2 || r.height < 2) continue;
        const rect = { x: (r.left - pr.left) / pr.width, y: (r.top - pr.top) / pr.height, w: r.width / pr.width, h: r.height / pr.height };
        const last = rects[rects.length - 1];
        if (last && Math.abs(last.y - rect.y) < 0.002 && Math.abs(last.h - rect.h) < 0.002) { const x1 = Math.max(last.x + last.w, rect.x + rect.w); last.x = Math.min(last.x, rect.x); last.w = x1 - last.x; }
        else rects.push(rect);
      }
      const bb = range.getBoundingClientRect();
      propsRef.current.onPending({ text, position: { page, rects } as PdfPosition, y: bb.top + bb.height / 2 });
    };
    const onChange = () => { clearTimeout(t); t = setTimeout(read, 250); };
    document.addEventListener('selectionchange', onChange);
    return () => { document.removeEventListener('selectionchange', onChange); clearTimeout(t); };
  }, []);

  const onPageClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const hl = target.closest<HTMLElement>('.pdf-hl');
    if (hl) { const r = hl.getBoundingClientRect(); p.onActive({ id: hl.dataset.hl!, y: r.top + r.height / 2 }); return; }
    if (target.closest('a')) return;
    const sel = window.getSelection(); if (sel && !sel.isCollapsed) return;
    p.onActive(null); p.onTap();
  };

  // ── Handle ──────────────────────────────────────────────────────────────
  const scrollToBox = useCallback((page: number, box?: Rect) => {
    const el = pageEls.current[page]; if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY + (box ? box.y * el.offsetHeight : 0) - 120;
    window.scrollTo({ top, behavior: 'smooth' });
  }, []);
  const handle = useMemo(() => ({
    jumpTo: (target: string | number) => scrollToBox(Number(target)),
    getParagraphs: () => parasRef.current.map(x => ({ id: x.id, text: x.text })),
    scrollToParagraph: (id: string) => { const para = parasRef.current.find(x => x.id === id); if (para) scrollToBox(para.page, para.box); },
    setSpokenRange: (id: string | null) => { const para = id ? parasRef.current.find(x => x.id === id) : null; setSpoken(para ? { page: para.page, box: para.box } : null); },
    returnToProgress: () => { const h = document.documentElement; window.scrollTo({ top: p.doc.progress * (h.scrollHeight - window.innerHeight), behavior: 'smooth' }); },
    find: (query: string) => {
      const q = query.trim().toLowerCase(); const hits = q ? parasRef.current.filter(x => x.text.toLowerCase().includes(q)).map(x => ({ page: x.page, box: x.box })) : [];
      findState.current = { hits, index: 0 }; setFindHits(hits); setFindIndex(0);
      if (hits[0]) scrollToBox(hits[0].page, hits[0].box);
      return hits.length;
    },
    findNext: (dir: 1 | -1) => { const s = findState.current; if (!s.hits.length) return 0; s.index = (s.index + dir + s.hits.length) % s.hits.length; setFindIndex(s.index); scrollToBox(s.hits[s.index].page, s.hits[s.index].box); return s.index; },
  }), [p.doc.progress, scrollToBox]);
  useEffect(() => { p.registerHandle(handle); }, [handle, p]);

  // Paragraph anchors so the Listen player can find the spoken one on screen
  useEffect(() => { setHeights(h => h); }, [spoken]);

  const boxStyle = (b: Rect) => ({ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` });

  return (
    <div className="min-h-dvh bg-reader-bg pb-40 pt-[calc(var(--safe-top)+8px)]">
      {p.doc.filePath && width > 0 && (
        <Document file={p.doc.filePath} onLoadSuccess={onLoad} loading={<p className="py-20 text-center text-[14px] text-ink-2">Opening PDF…</p>} error={<p className="py-20 text-center text-[14px] text-danger">Couldn&apos;t open this PDF.</p>}>
          {Array.from({ length: numPages }, (_, i) => i + 1).map(n => (
            <div
              key={n}
              data-page={n}
              ref={el => { pageEls.current[n] = el; }}
              onClick={onPageClick}
              className="relative mx-auto mb-2"
              style={{ width, minHeight: heights[n] ?? width * 1.3 }}
            >
              {visible.has(n) && (
                <Page pageNumber={n} width={width} renderAnnotationLayer={false} renderTextLayer onRenderSuccess={(pg) => setHeights(h => ({ ...h, [n]: pg.height }))} />
              )}
              {/* highlight boxes */}
              {[...positions.entries()].filter(([, pos]) => pos.page === n).map(([id, pos]) => {
                const h = p.highlights.find(x => x.id === id)!;
                return pos.rects.map((r, i) => <div key={id + i} data-hl={id} className={`pdf-hl hl-${h.color}${id === p.activeHighlightId ? ' hl-active' : ''}`} style={boxStyle(r)} />);
              })}
              {spoken?.page === n && <div className="pointer-events-none absolute rounded-md bg-[rgba(70,147,254,.22)]" style={boxStyle(spoken.box)} data-para-id="spoken" />}
              {findHits.map((hit, i) => hit.page === n && <div key={i} className={`pointer-events-none absolute rounded ${i === findIndex ? 'bg-[rgba(255,196,0,.45)]' : 'bg-[rgba(0,114,255,.25)]'}`} style={boxStyle(hit.box)} />)}
            </div>
          ))}
        </Document>
      )}
    </div>
  );
}
