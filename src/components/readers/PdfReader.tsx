'use client';

import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import Link from 'next/link';
import type { ReadingItem, ReadingHighlight } from '@/app/read/[id]/page';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  item: ReadingItem;
  highlights: ReadingHighlight[];
  saveHighlight: (payload: Omit<ReadingHighlight, 'id' | 'readingItemId' | 'createdAt'>) => Promise<ReadingHighlight>;
  deleteHighlight: (id: string) => Promise<void>;
  saveProgress: (progress: unknown) => Promise<void>;
  backHref: string;
  backLabel: string;
}

interface SelectionInfo { text: string; page: number; }

export default function PdfReader({
  item, highlights, saveHighlight, deleteHighlight, saveProgress, backHref, backLabel,
}: Props) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(
    item.readingProgress ? JSON.parse(item.readingProgress).page ?? 1 : 1
  );
  const [selected, setSelected] = useState<SelectionInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [width, setWidth] = useState(700);

  const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const handleMouseUp = useCallback(() => {
    const text = window.getSelection()?.toString().trim();
    if (text) setSelected({ text, page: pageNumber });
    else setSelected(null);
  }, [pageNumber]);

  const goTo = (page: number) => {
    const p = Math.max(1, Math.min(numPages, page));
    setPageNumber(p);
    saveProgress({ page: p });
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await saveHighlight({
        text: selected.text,
        imageUrl: null,
        type: 'text',
        position: { page: selected.page, text: selected.text },
        note: null,
      });
      window.getSelection()?.removeAllRanges();
      setSelected(null);
    } finally {
      setSaving(false);
    }
  };

  // Highlights on current page
  const pageHighlights = highlights.filter(h => {
    try { return JSON.parse(h.position).page === pageNumber; } catch { return false; }
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <Link href={backHref} className="text-sm text-blue-600 hover:text-blue-700 whitespace-nowrap shrink-0">
            {backLabel}
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => goTo(pageNumber - 1)} disabled={pageNumber <= 1}
              className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">←</button>
            <span className="text-sm text-gray-600 dark:text-gray-400 w-24 text-center">
              {pageNumber} / {numPages || '…'}
            </span>
            <button onClick={() => goTo(pageNumber + 1)} disabled={pageNumber >= numPages}
              className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">→</button>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => setWidth(w => Math.max(400, w - 100))}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">A-</button>
            <button onClick={() => setWidth(w => Math.min(1200, w + 100))}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">A+</button>
          </div>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="flex-1 overflow-auto flex justify-center py-6 px-4">
        <div onMouseUp={handleMouseUp} onTouchEnd={handleMouseUp}>
          <Document file={item.filePath!} onLoadSuccess={onLoadSuccess}
            loading={<p className="text-gray-500 p-8">Loading PDF…</p>}
            error={<p className="text-red-500 p-8">Failed to load PDF</p>}>
            <Page
              pageNumber={pageNumber}
              width={Math.min(width, typeof window !== 'undefined' ? window.innerWidth - 32 : 700)}
              renderTextLayer={true}
              renderAnnotationLayer={false}
              className="shadow-xl rounded"
            />
          </Document>
        </div>
      </div>

      {/* Page highlights list (current page) */}
      {pageHighlights.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800 px-4 py-2">
          <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium mb-1">Highlights on this page:</p>
          <div className="flex flex-col gap-1">
            {pageHighlights.map(h => (
              <div key={h.id} className="flex items-start justify-between gap-2 text-xs">
                <span className="text-yellow-800 dark:text-yellow-300 line-clamp-1">"{h.text}"</span>
                <button onClick={() => deleteHighlight(h.id)}
                  className="text-red-400 hover:text-red-600 shrink-0">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Highlight button */}
      {selected && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
              <span>✦</span> {saving ? 'Saving…' : 'Highlight'}
            </button>
            <button onClick={() => setSelected(null)}
              className="px-3 py-2 text-gray-500 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Keyboard nav */}
      {typeof window !== 'undefined' && (() => {
        const handler = (e: KeyboardEvent) => {
          if (e.key === 'ArrowLeft') goTo(pageNumber - 1);
          if (e.key === 'ArrowRight') goTo(pageNumber + 1);
        };
        window.addEventListener('keydown', handler);
        return null;
      })()}
    </div>
  );
}
