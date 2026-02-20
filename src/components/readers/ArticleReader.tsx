'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import type { ReadingItem, ReadingHighlight } from '@/app/read/[id]/page';

interface Props {
  item: ReadingItem;
  highlights: ReadingHighlight[];
  saveHighlight: (payload: Omit<ReadingHighlight, 'id' | 'readingItemId' | 'createdAt'>) => Promise<ReadingHighlight>;
  deleteHighlight: (id: string) => Promise<void>;
  saveProgress: (progress: unknown) => Promise<void>;
  backHref: string;
  backLabel: string;
}

interface SelectionInfo {
  text: string;
  x: number;
  y: number;
}

interface ActiveHighlight {
  id: string;
  x: number;
  y: number;
}

// Walk text nodes in an element and wrap matching text with a <mark>
function applyTextHighlight(container: HTMLElement, text: string, highlightId: string) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    if (node.textContent?.includes(text)) nodes.push(node);
  }
  if (nodes.length === 0) return;
  const textNode = nodes[0];
  const idx = textNode.textContent!.indexOf(text);
  if (idx < 0) return;
  try {
    const range = document.createRange();
    range.setStart(textNode, idx);
    range.setEnd(textNode, idx + text.length);
    const mark = document.createElement('mark');
    mark.dataset.highlightId = highlightId;
    mark.className = 'bg-yellow-200 dark:bg-yellow-500/40 cursor-pointer rounded px-0.5 transition-colors hover:bg-yellow-300 dark:hover:bg-yellow-500/60';
    range.surroundContents(mark);
  } catch {
    // surroundContents fails if the range spans multiple elements — skip gracefully
  }
}

export default function ArticleReader({
  item, highlights, saveHighlight, deleteHighlight, backHref, backLabel,
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [selectionInfo, setSelectionInfo] = useState<SelectionInfo | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<ActiveHighlight | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(highlights.map(h => h.id)));

  // Apply saved highlights to DOM
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    // Remove existing marks first (clean re-apply)
    container.querySelectorAll('mark[data-highlight-id]').forEach(el => {
      const parent = el.parentNode!;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
    });
    highlights.forEach(h => {
      if (h.type === 'text' && h.text) applyTextHighlight(container, h.text, h.id);
    });
    // Bind click on marks
    container.querySelectorAll('mark[data-highlight-id]').forEach(el => {
      (el as HTMLElement).onclick = (e) => {
        e.stopPropagation();
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setActiveHighlight({ id: (el as HTMLElement).dataset.highlightId!, x: rect.left + rect.width / 2, y: rect.top });
        setSelectionInfo(null);
      };
    });
    // Bind click on images
    container.querySelectorAll('img').forEach(img => {
      img.style.cursor = 'pointer';
      img.onclick = (e) => {
        e.stopPropagation();
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setSelectionInfo({ text: '', x: rect.left + rect.width / 2, y: rect.top });
        setActiveHighlight(null);
        // Store image src for the highlight
        (img as HTMLElement).dataset.pendingHighlight = 'true';
        window.__pendingImageSrc = img.src;
      };
    });
    setSavedIds(new Set(highlights.map(h => h.id)));
  }, [highlights]);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectionInfo(null);
      return;
    }
    const text = selection.toString().trim();
    if (!text) { setSelectionInfo(null); return; }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setSelectionInfo({ text, x: rect.left + rect.width / 2, y: rect.top + window.scrollY });
    setActiveHighlight(null);
  }, []);

  const handleSaveHighlight = async () => {
    if (!selectionInfo) return;
    setSaving(true);
    try {
      const isImage = !selectionInfo.text && window.__pendingImageSrc;
      await saveHighlight({
        text: isImage ? null : selectionInfo.text,
        imageUrl: isImage ? window.__pendingImageSrc : null,
        type: isImage ? 'image' : 'text',
        position: { text: selectionInfo.text },
        note: null,
      });
      window.getSelection()?.removeAllRanges();
      window.__pendingImageSrc = undefined;
    } finally {
      setSaving(false);
      setSelectionInfo(null);
    }
  };

  const handleDeleteHighlight = async () => {
    if (!activeHighlight) return;
    await deleteHighlight(activeHighlight.id);
    setActiveHighlight(null);
  };

  // Dismiss popovers on click outside
  useEffect(() => {
    const dismiss = () => { setSelectionInfo(null); setActiveHighlight(null); };
    document.addEventListener('mousedown', dismiss);
    return () => document.removeEventListener('mousedown', dismiss);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href={backHref} className="text-sm text-blue-600 hover:text-blue-700 whitespace-nowrap shrink-0">
            {backLabel}
          </Link>
          <h1 className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate text-center flex-1">
            {item.title}
          </h1>
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-gray-600 whitespace-nowrap shrink-0">
              Original ↗
            </a>
          )}
        </div>
      </div>

      {/* Article */}
      <div className="max-w-2xl mx-auto px-4 py-10">
        {item.author && <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{item.author}</p>}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">{item.title}</h1>

        <div
          ref={contentRef}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          className="prose prose-gray dark:prose-invert max-w-none prose-img:rounded-xl prose-img:cursor-pointer prose-a:text-blue-600 select-text"
          dangerouslySetInnerHTML={{ __html: item.content || '' }}
        />
      </div>

      {/* Floating Highlight button (on selection) */}
      {selectionInfo && (
        <div
          className="fixed z-50 -translate-x-1/2 -translate-y-full mt-[-8px]"
          style={{ left: selectionInfo.x, top: selectionInfo.y }}
          onMouseDown={e => e.stopPropagation()}
        >
          <button
            onClick={handleSaveHighlight}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-sm font-semibold rounded-full shadow-lg transition-colors disabled:opacity-60"
          >
            <span>✦</span> {saving ? 'Saving…' : 'Highlight'}
          </button>
        </div>
      )}

      {/* Delete popover (on existing highlight click) */}
      {activeHighlight && (
        <div
          className="fixed z-50 -translate-x-1/2 -translate-y-full"
          style={{ left: activeHighlight.x, top: activeHighlight.y + window.scrollY }}
          onMouseDown={e => e.stopPropagation()}
        >
          <button
            onClick={handleDeleteHighlight}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-full shadow-lg transition-colors"
          >
            ✕ Remove highlight
          </button>
        </div>
      )}
    </div>
  );
}

// Global type extension for pending image src
declare global {
  interface Window { __pendingImageSrc?: string; }
}
