'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { ReactReader, ReactReaderStyle } from 'react-reader';
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

interface SelectedInfo {
  cfiRange: string;
  text: string;
}

export default function EpubReader({
  item, highlights, saveHighlight, deleteHighlight, saveProgress, backHref, backLabel,
}: Props) {
  const renditionRef = useRef<import('epubjs').Rendition | undefined>(undefined);
  const [location, setLocation] = useState<string | number>(
    item.readingProgress ? JSON.parse(item.readingProgress) : 0
  );
  const [selected, setSelected] = useState<SelectedInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [darkMode, setDarkMode] = useState(false);

  // Apply existing highlights when rendition is ready
  const applyHighlights = useCallback((rendition: import('epubjs').Rendition) => {
    highlights.forEach(h => {
      if (h.type === 'text' && h.position) {
        try {
          const pos = JSON.parse(h.position);
          if (pos.cfi) {
            rendition.annotations.highlight(pos.cfi, {}, (e: MouseEvent) => {
              e.stopPropagation();
              if (window.confirm('Remove this highlight?')) {
                deleteHighlight(h.id).then(() => {
                  rendition.annotations.remove(pos.cfi, 'highlight');
                });
              }
            }, 'reading-highlight', { fill: 'rgba(253, 224, 71, 0.5)' });
          }
        } catch { /* ignore bad position data */ }
      }
    });
  }, [highlights, deleteHighlight]);

  // Keyboard navigation — listen on the parent window
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!renditionRef.current) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        renditionRef.current.next();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        renditionRef.current.prev();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleSaveHighlight = async () => {
    if (!selected || !renditionRef.current) return;
    setSaving(true);
    try {
      await saveHighlight({
        text: selected.text,
        imageUrl: null,
        type: 'text',
        position: { cfi: selected.cfiRange },
        note: null,
      });
      renditionRef.current.annotations.highlight(
        selected.cfiRange, {}, undefined, 'reading-highlight',
        { fill: 'rgba(253, 224, 71, 0.5)' }
      );
      setSelected(null);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.fontSize(`${fontSize}%`);
    }
  }, [fontSize]);

  const readerStyles = darkMode ? {
    ...ReactReaderStyle,
    readerArea: { ...ReactReaderStyle.readerArea, background: '#1f2937', color: '#f9fafb' },
  } : ReactReaderStyle;

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="shrink-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <Link href={backHref} className="text-sm text-blue-600 hover:text-blue-700 whitespace-nowrap shrink-0">
            {backLabel}
          </Link>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate text-center flex-1">{item.title}</p>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setFontSize(s => Math.max(70, s - 10))}
              className="w-7 h-7 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-bold flex items-center justify-center">A-</button>
            <button onClick={() => setFontSize(s => Math.min(150, s + 10))}
              className="w-7 h-7 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-bold flex items-center justify-center">A+</button>
            <button onClick={() => setDarkMode(d => !d)}
              className="w-7 h-7 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm flex items-center justify-center">
              {darkMode ? '☀' : '🌙'}
            </button>
          </div>
        </div>
      </div>

      {/* Reader */}
      <div className="flex-1 relative">
        <ReactReader
          url={item.filePath!}
          title={item.title}
          location={location}
          locationChanged={(loc: string) => {
            setLocation(loc);
            saveProgress(loc);
          }}
          readerStyles={readerStyles}
          getRendition={(rendition) => {
            renditionRef.current = rendition;
            rendition.themes.fontSize(`${fontSize}%`);
            applyHighlights(rendition);

            // Forward keyboard events from inside the iframe to the parent window
            rendition.on('keydown', (e: KeyboardEvent) => {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: e.key, bubbles: true }));
            });

            rendition.on('selected', (cfiRange: string) => {
              const selection = rendition.getContents()[0]?.window?.getSelection();
              const text = selection?.toString().trim() || '';
              if (text) setSelected({ cfiRange, text });
            });
          }}
        />
      </div>

      {/* Prev / Next buttons */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => renditionRef.current?.prev()}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
          ← Previous
        </button>
        <button
          onClick={() => renditionRef.current?.next()}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
          Next →
        </button>
      </div>

      {/* Highlight button */}
      {selected && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
          <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2">
            <button onClick={handleSaveHighlight} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
              <span>✦</span> {saving ? 'Saving…' : 'Highlight'}
            </button>
            <button onClick={() => setSelected(null)}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
