'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Highlight {
  id: string;
  text: string;
  note?: string;
  title?: string;
  author?: string;
  url?: string;
  tags?: string;
  highlightedAt: string;
  source: {
    name: string;
  };
}

export default function HighlightsPage() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'raindrop' | 'readwise'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHighlights();
  }, []);

  async function fetchHighlights() {
    try {
      const response = await fetch('/api/highlights');
      const data = await response.json();
      setHighlights(data);
    } catch (error) {
      console.error('Failed to fetch highlights:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredHighlights = highlights.filter(h => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'raindrop' && h.source.name === 'Raindrop') ||
      (filter === 'readwise' && h.source.name === 'Readwise Reader');

    const matchesSearch =
      searchTerm === '' ||
      h.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.note?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading highlights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <Link href="/" className="text-green-600 hover:text-green-700 mb-8 inline-block">
          ← Back to Home
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">All Highlights</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {highlights.length} highlight{highlights.length !== 1 ? 's' : ''} from your reading apps
          </p>
        </div>

        {/* Filters and search */}
        <div className="mb-8 space-y-4">
          <input
            type="text"
            placeholder="Search highlights..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />

          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('raindrop')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'raindrop'
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Raindrop
            </button>
            <button
              onClick={() => setFilter('readwise')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'readwise'
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Readwise
            </button>
          </div>
        </div>

        {/* Highlights list */}
        {filteredHighlights.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {searchTerm || filter !== 'all'
                ? 'No highlights match your filters'
                : 'No highlights yet'}
            </p>
            {!searchTerm && filter === 'all' && (
              <Link
                href="/sync"
                className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-medium transition-colors"
              >
                Sync Highlights
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHighlights.map(highlight => (
              <div
                key={highlight.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                      {highlight.source.name}
                    </span>
                    {highlight.tags && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {highlight.tags}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(highlight.highlightedAt).toLocaleDateString()}
                  </span>
                </div>

                {highlight.title && (
                  <h3 className="font-semibold mb-2">{highlight.title}</h3>
                )}
                {highlight.author && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    by {highlight.author}
                  </p>
                )}

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-lg mb-3">
                  <p className="text-gray-800 dark:text-gray-200">{highlight.text}</p>
                </div>

                {highlight.note && (
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-3">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      YOUR NOTE
                    </p>
                    <p className="text-gray-800 dark:text-gray-200">{highlight.note}</p>
                  </div>
                )}

                {highlight.url && (
                  <a
                    href={highlight.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 text-sm"
                  >
                    View source →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
