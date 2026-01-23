'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SyncResult {
  raindrop: { success: boolean; count: number; error: string | null };
  readwise: { success: boolean; count: number; error: string | null };
}

export default function SyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  async function handleSync(source: 'raindrop' | 'readwise' | 'all') {
    setSyncing(true);
    setResult(null);

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link href="/" className="text-blue-600 hover:text-blue-700 mb-8 inline-block">
          ← Back to Home
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Sync Highlights</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Import highlights from your reading apps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => handleSync('raindrop')}
            disabled={syncing}
            className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="text-2xl mb-3">💧</div>
            <h2 className="text-xl font-semibold mb-2">Raindrop</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sync from Raindrop.io
            </p>
          </button>

          <button
            onClick={() => handleSync('readwise')}
            disabled={syncing}
            className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="text-2xl mb-3">📚</div>
            <h2 className="text-xl font-semibold mb-2">Readwise</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sync from Readwise Reader
            </p>
          </button>

          <button
            onClick={() => handleSync('all')}
            disabled={syncing}
            className="p-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="text-2xl mb-3">🔄</div>
            <h2 className="text-xl font-semibold mb-2">Sync All</h2>
            <p className="text-sm text-blue-100">
              Sync from all sources
            </p>
          </button>
        </div>

        {syncing && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-blue-800 dark:text-blue-300 font-medium">Syncing highlights...</p>
          </div>
        )}

        {result && !syncing && (
          <div className="space-y-4">
            {/* Raindrop result */}
            {result.raindrop && (
              <div
                className={`rounded-2xl p-6 border ${
                  result.raindrop.success
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : result.raindrop.error
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <h3 className="font-semibold mb-2">Raindrop</h3>
                {result.raindrop.success ? (
                  <p className="text-green-800 dark:text-green-300">
                    Successfully imported {result.raindrop.count} new highlight(s)
                  </p>
                ) : result.raindrop.error ? (
                  <p className="text-red-800 dark:text-red-300">Error: {result.raindrop.error}</p>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">Not synced</p>
                )}
              </div>
            )}

            {/* Readwise result */}
            {result.readwise && (
              <div
                className={`rounded-2xl p-6 border ${
                  result.readwise.success
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : result.readwise.error
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <h3 className="font-semibold mb-2">Readwise Reader</h3>
                {result.readwise.success ? (
                  <p className="text-green-800 dark:text-green-300">
                    Successfully imported {result.readwise.count} new highlight(s)
                  </p>
                ) : result.readwise.error ? (
                  <p className="text-red-800 dark:text-red-300">Error: {result.readwise.error}</p>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">Not synced</p>
                )}
              </div>
            )}

            <div className="text-center pt-6">
              <Link
                href="/review"
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors"
              >
                Start Reviewing
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
