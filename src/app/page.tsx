'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { NotificationSetup } from '@/components/NotificationSetup';

interface ReadingItem {
  id: string;
  title: string;
  author: string | null;
  type: string;
  filePath: string | null;
  ogImage: string | null;
  readingProgress: string | null;
  createdAt: string;
  _count: { readingHighlights: number };
}

const TYPE_LABELS: Record<string, string> = { epub: 'EPUB', pdf: 'PDF', article: 'Article' };
const TYPE_COLORS: Record<string, string> = {
  epub: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  pdf: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  article: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
};
const TYPE_GRADIENTS: Record<string, string> = {
  epub: 'from-gray-200 to-gray-400',
  pdf: 'from-gray-200 to-gray-400',
  article: 'from-blue-400 to-cyan-600',
};

export default function Home() {
  const [items, setItems] = useState<ReadingItem[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addTab, setAddTab] = useState<'url' | 'file'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/library').then(r => r.json()),
      fetch('/api/review').then(r => r.json()),
    ]).then(([lib, reviews]) => {
      setItems(Array.isArray(lib) ? lib : []);
      setDueCount(Array.isArray(reviews) ? reviews.length : 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleAddUrl() {
    setAddError('');
    if (!urlInput.trim()) { setAddError('Please enter a URL'); return; }
    setAdding(true);
    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error || 'Failed to add article'); return; }
      setItems(prev => [data, ...prev]);
      setUrlInput(''); setShowAdd(false);
    } catch { setAddError('Network error. Please try again.'); }
    finally { setAdding(false); }
  }

  async function handleAddFile() {
    setAddError('');
    if (!fileInput) { setAddError('Please select a file'); return; }
    setAdding(true);
    try {
      const formData = new FormData();
      formData.append('file', fileInput);
      if (titleInput.trim()) formData.append('title', titleInput.trim());
      const res = await fetch('/api/library', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error || 'Failed to upload'); return; }
      setItems(prev => [data, ...prev]);
      setFileInput(null); setTitleInput(''); setShowAdd(false);
      if (fileRef.current) fileRef.current.value = '';
    } catch { setAddError('Network error. Please try again.'); }
    finally { setAdding(false); }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (!confirm('Remove this item from your library?')) return;
    await fetch(`/api/library/${id}`, { method: 'DELETE' });
    setItems(prev => prev.filter(i => i.id !== id));
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <NotificationSetup />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">My Library</h1>
          <div className="flex items-center gap-3">
            {dueCount > 0 && (
              <Link href="/review"
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full transition-colors">
                <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">{dueCount}</span>
                Review due
              </Link>
            )}
            {/* Utility menu */}
            <div ref={menuRef} className="relative">
              <button onClick={() => setShowMenu(v => !v)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-lg">
                ⋯
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-50">
                  {[
                    { href: '/review', label: 'Daily Review' },
                    { href: '/highlights', label: 'All Highlights' },
                    { href: '/add', label: 'Add Highlight' },
                    { href: '/sync', label: 'Sync Highlights' },
                    { href: '/settings', label: 'Settings' },
                  ].map(({ href, label }) => (
                    <Link key={href} href={href} onClick={() => setShowMenu(false)}
                      className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Your library is empty</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Add articles, EPUBs, or PDFs to get started</p>
            <button onClick={() => setShowAdd(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium text-sm transition-colors">
              Add your first item
            </button>
          </div>
        )}

        {/* Library grid */}
        {items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map(item => (
              <Link key={item.id} href={`/read/${item.id}`} className="group relative">
                {/* Cover */}
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2 shadow-sm group-hover:shadow-md transition-shadow">
                  {item.type === 'article' && item.ogImage ? (
                    <img src={item.ogImage} alt={item.title} loading="lazy"
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${TYPE_GRADIENTS[item.type] || 'from-gray-400 to-gray-600'} flex items-end p-3`}>
                      <p className="text-white text-xs font-medium line-clamp-3 leading-snug">{item.title}</p>
                    </div>
                  )}
                  {/* Type badge */}
                  <span className={`absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TYPE_COLORS[item.type]}`}>
                    {TYPE_LABELS[item.type]}
                  </span>
                  {/* Highlight count */}
                  {(item._count?.readingHighlights ?? 0) > 0 && (
                    <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-400/90 text-yellow-900">
                      {item._count.readingHighlights}✦
                    </span>
                  )}
                  {/* Delete button (hover) */}
                  <button onClick={(e) => handleDelete(item.id, e)}
                    className="absolute bottom-2 right-2 w-6 h-6 bg-black/50 hover:bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    ✕
                  </button>
                </div>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug">{item.title}</p>
                {item.author && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{item.author}</p>}
              </Link>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-24">
            <p className="text-gray-400">Loading library…</p>
          </div>
        )}
      </div>

      {/* FAB — Add to library */}
      <button onClick={() => { setShowAdd(true); setAddError(''); }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl text-2xl flex items-center justify-center transition-all hover:scale-105 z-40">
        +
      </button>

      {/* Add item modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add to Library</h2>
                <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 mb-5">
                {(['url', 'file'] as const).map(tab => (
                  <button key={tab} onClick={() => { setAddTab(tab); setAddError(''); }}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${addTab === tab ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                    {tab === 'url' ? 'Paste URL' : 'Upload File'}
                  </button>
                ))}
              </div>

              {addError && (
                <p className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">{addError}</p>
              )}

              {addTab === 'url' ? (
                <div className="space-y-3">
                  <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://example.com/article"
                    onKeyDown={e => e.key === 'Enter' && handleAddUrl()}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <p className="text-xs text-gray-400">Paste any article URL — we'll save the full text for offline reading.</p>
                  <button onClick={handleAddUrl} disabled={adding}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
                    {adding ? 'Saving article…' : 'Save Article'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input ref={fileRef} type="text" value={titleInput} onChange={e => setTitleInput(e.target.value)}
                    placeholder="Title (optional — auto-detected)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <div
                    onClick={() => { const el = document.getElementById('lib-file-input'); el?.click(); }}
                    className="w-full py-8 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl text-center cursor-pointer hover:border-blue-400 transition-colors"
                  >
                    {fileInput ? (
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{fileInput.name}</p>
                    ) : (
                      <>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Click to choose an EPUB or PDF</p>
                        <p className="text-xs text-gray-400 mt-1">.epub, .pdf</p>
                      </>
                    )}
                  </div>
                  <input id="lib-file-input" type="file" accept=".epub,.pdf" className="hidden"
                    onChange={e => setFileInput(e.target.files?.[0] || null)} />
                  <button onClick={handleAddFile} disabled={adding || !fileInput}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
                    {adding ? 'Uploading…' : 'Upload'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
