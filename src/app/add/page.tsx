'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

type Tab = 'write' | 'preview';

export default function AddHighlightPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [origin, setOrigin] = useState('');
  const [tab, setTab] = useState<Tab>('write');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Insert text at cursor position in textarea
  function insertAtCursor(text: string) {
    const el = textareaRef.current;
    if (!el) {
      setBody(prev => prev + text);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const prefix = body.slice(0, start);
    const suffix = body.slice(end);
    const newBody = prefix + text + suffix;
    setBody(newBody);
    // Restore cursor after inserted text
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    });
  }

  async function uploadFile(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Image upload failed');
      return null;
    }
    const { url } = await res.json();
    return url;
  }

  const handleImageUpload = useCallback(async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const url = await uploadFile(file);
      if (url) insertAtCursor(`![image](${url})\n`);
    } finally {
      setUploading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body]);

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
    e.target.value = '';
  }

  async function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const imageFile = Array.from(e.clipboardData.items)
      .find(item => item.type.startsWith('image/'))
      ?.getAsFile();
    if (!imageFile) return;
    e.preventDefault();
    await handleImageUpload(imageFile);
  }

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
            <button className="underline font-medium" onClick={() => setSaved(false)}>
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

            {/* Image upload toolbar (only in write mode) */}
            {tab === 'write' && (
              <div className="flex items-center gap-2 mb-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Uploading…' : '+ Image'}
                </button>
                <span className="text-xs text-gray-400">or paste an image with ⌘V</span>
              </div>
            )}

            {tab === 'write' ? (
              <textarea
                ref={textareaRef}
                value={body}
                onChange={e => setBody(e.target.value)}
                onPaste={handlePaste}
                rows={10}
                placeholder="Write your highlight here. Supports plain text, images, and tables."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono resize-y"
              />
            ) : (
              <div className="min-h-[200px] px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                {body.trim() ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkBreaks]}>{body}</ReactMarkdown>
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
            disabled={saving || uploading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save Highlight'}
          </button>

        </form>
      </div>
    </div>
  );
}
