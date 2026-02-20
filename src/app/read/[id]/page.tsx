'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ArticleReader = dynamic(() => import('@/components/readers/ArticleReader'), { ssr: false });
const EpubReader   = dynamic(() => import('@/components/readers/EpubReader'),   { ssr: false });
const PdfReader    = dynamic(() => import('@/components/readers/PdfReader'),    { ssr: false });

export interface ReadingItem {
  id: string;
  title: string;
  author: string | null;
  type: string;
  filePath: string | null;
  url: string | null;
  content: string | null;
  ogImage: string | null;
  readingProgress: string | null;
}

export interface ReadingHighlight {
  id: string;
  readingItemId: string;
  text: string | null;
  imageUrl: string | null;
  type: string;
  position: string;
  note: string | null;
  createdAt: string;
}

export default function ReadPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const [item, setItem] = useState<ReadingItem | null>(null);
  const [highlights, setHighlights] = useState<ReadingHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [itemRes, hlRes] = await Promise.all([
          fetch(`/api/library/${id}`),
          fetch(`/api/library/${id}/highlights`),
        ]);
        if (!itemRes.ok) throw new Error('Item not found');
        const itemData = await itemRes.json();
        const hlData = hlRes.ok ? await hlRes.json() : [];
        setItem(itemData);
        setHighlights(hlData);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function saveHighlight(payload: Omit<ReadingHighlight, 'id' | 'readingItemId' | 'createdAt'>) {
    const res = await fetch(`/api/library/${id}/highlights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to save highlight');
    const saved: ReadingHighlight = await res.json();
    setHighlights(prev => [...prev, saved]);
    return saved;
  }

  async function deleteHighlight(highlightId: string) {
    await fetch(`/api/library/highlights/${highlightId}`, { method: 'DELETE' });
    setHighlights(prev => prev.filter(h => h.id !== highlightId));
  }

  async function saveProgress(progress: unknown) {
    await fetch(`/api/library/${id}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress }),
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-900">
        <p className="text-red-500">{error || 'Item not found'}</p>
        <Link href="/" className="text-blue-600 hover:underline">← Back to Library</Link>
      </div>
    );
  }

  const backHref = returnTo || '/';
  const backLabel = returnTo ? '← Back to Highlights' : '← Library';

  const readerProps = { item, highlights, saveHighlight, deleteHighlight, saveProgress, backHref, backLabel };

  return (
    <>
      {item.type === 'article' && <ArticleReader {...readerProps} />}
      {item.type === 'epub'    && <EpubReader    {...readerProps} />}
      {item.type === 'pdf'     && <PdfReader     {...readerProps} />}
    </>
  );
}
