'use client';

import { useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

type Tab = 'write' | 'preview';

export default function AddHighlightPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [origin, setOrigin] = useState('');
  const [tab, setTab] = useState<Tab>('write');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('Heading and body are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, text: body, url: origin }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      setTitle('');
      setBody('');
      setOrigin('');
      setTab('write');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
      <div className="max-w-2xl mx-auto px-6 py-16">

        <Link href="/" className="text-blue-600 hover:text-blue-700 mb-8 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-2">Add a Highlight</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-10 text-sm">
          Manually add something worth remembering. It'll be scheduled for spaced repetition review.
        </p>

        {saved && (
          <div className="mb-6 px-4 py-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl text-green-700 dark:text-green-300 text-sm">
            Highlight saved! It's now in your review queue.{' '}
            <button
              className="underline font-medium"
              onClick={() => setSaved(false)}
            >
              Add another
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Heading */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
              Heading
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. IDEO's Design Framework"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Body
              </label>
              <div className="flex gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setTab('write')}
                  className={`px-3 py-1 rounded-full font-medium transition-colors ${
                    tab === 'write'
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setTab('preview')}
                  className={`px-3 py-1 rounded-full font-medium transition-colors ${
                    tab === 'preview'
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {tab === 'write' ? (
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={10}
                placeholder={`Write your highlight here.\n\nSupports:\n• Plain text\n• Images: ![description](https://image-url.com)\n• Tables:\n| Column 1 | Column 2 |\n|----------|----------|\n| Value    | Value    |`}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono resize-y"
              />
            ) : (
              <div className="min-h-[200px] px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                {body.trim() ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{body}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm italic">Nothing to preview yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Origin */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
              Origin <span className="font-normal normal-case tracking-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="url"
              value={origin}
              onChange={e => setOrigin(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save Highlight'}
          </button>

        </form>
      </div>
    </div>
  );
}
