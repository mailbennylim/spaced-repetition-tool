'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';

type Tab = 'write' | 'preview';

const DEFAULT_ROWS = 3;
const DEFAULT_COLS = 3;

function makeTableData(rows: number, cols: number, prev?: string[][]): string[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => prev?.[r]?.[c] ?? '')
  );
}

export default function AddHighlightPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [origin, setOrigin] = useState('');
  const [tab, setTab] = useState<Tab>('write');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  // Table builder state
  const [showTable, setShowTable] = useState(false);
  const [tableRows, setTableRows] = useState(DEFAULT_ROWS);
  const [tableCols, setTableCols] = useState(DEFAULT_COLS);
  const [tableData, setTableData] = useState<string[][]>(() => makeTableData(DEFAULT_ROWS, DEFAULT_COLS));

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Insert text at cursor position in textarea
  function insertAtCursor(text: string) {
    const el = textareaRef.current;
    if (!el) { setBody(prev => prev + text); return; }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const newBody = body.slice(0, start) + text + body.slice(end);
    setBody(newBody);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    });
  }

  // Wrap selected text (or insert placeholder) with a prefix/suffix
  function wrapSelection(prefix: string, suffix: string, placeholder: string) {
    const el = textareaRef.current;
    if (!el) { insertAtCursor(`${prefix}${placeholder}${suffix}`); return; }
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = body.slice(start, end) || placeholder;
    const newBody = body.slice(0, start) + prefix + selected + suffix + body.slice(end);
    setBody(newBody);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  }

  // Table row/col change — preserve existing cell values
  function changeTableSize(rows: number, cols: number) {
    setTableRows(rows);
    setTableCols(cols);
    setTableData(prev => makeTableData(rows, cols, prev));
  }

  function updateCell(r: number, c: number, val: string) {
    setTableData(prev => prev.map((row, ri) => row.map((cell, ci) => ri === r && ci === c ? val : cell)));
  }

  function buildTableMarkdown(): string {
    const colWidth = 8;
    const pad = (s: string) => s.padEnd(colWidth);
    const header = '| ' + tableData[0].map(pad).join(' | ') + ' |';
    const sep    = '| ' + tableData[0].map(() => '-'.repeat(colWidth)).join(' | ') + ' |';
    const rows   = tableData.slice(1).map(row => '| ' + row.map(pad).join(' | ') + ' |');
    return '\n' + [header, sep, ...rows].join('\n') + '\n';
  }

  function handleInsertTable() {
    insertAtCursor(buildTableMarkdown());
    setShowTable(false);
    setTableRows(DEFAULT_ROWS);
    setTableCols(DEFAULT_COLS);
    setTableData(makeTableData(DEFAULT_ROWS, DEFAULT_COLS));
  }

  async function uploadFile(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Image upload failed'); return null; }
    const { url } = await res.json();
    return url;
  }

  const handleImageUpload = useCallback(async (file: File) => {
    setUploading(true); setError('');
    try {
      const url = await uploadFile(file);
      if (url) insertAtCursor(`![image](${url})\n`);
    } finally { setUploading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body]);

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
    e.target.value = '';
  }

  async function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const imageFile = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'))?.getAsFile();
    if (!imageFile) return;
    e.preventDefault();
    await handleImageUpload(imageFile);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) { setError('Heading and body are required.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, text: body, url: origin }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true); setTitle(''); setBody(''); setOrigin(''); setTab('write');
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setSaving(false); }
  }

  const btnClass = "text-xs px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 font-medium";

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
            <button className="underline font-medium" onClick={() => setSaved(false)}>Add another</button>
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
                <button type="button" onClick={() => setTab('write')}
                  className={`px-3 py-1 rounded-full font-medium transition-colors ${tab === 'write' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                  Write
                </button>
                <button type="button" onClick={() => setTab('preview')}
                  className={`px-3 py-1 rounded-full font-medium transition-colors ${tab === 'preview' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                  Preview
                </button>
              </div>
            </div>

            {/* Toolbar (write mode only) */}
            {tab === 'write' && (
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                {/* Formatting */}
                <button type="button" className={btnClass} onClick={() => wrapSelection('**', '**', 'bold text')} title="Bold"><b>B</b></button>
                <button type="button" className={btnClass} onClick={() => wrapSelection('*', '*', 'italic text')} title="Italic"><i>I</i></button>
                <button type="button" className={btnClass} onClick={() => wrapSelection('<u>', '</u>', 'underlined text')} title="Underline"><u>U</u></button>

                <span className="text-gray-300 dark:text-gray-600 select-none">|</span>

                {/* Image */}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInputChange} />
                <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} className={btnClass}>
                  {uploading ? 'Uploading…' : '+ Image'}
                </button>

                {/* Table */}
                <button type="button" className={btnClass} onClick={() => setShowTable(v => !v)}>
                  + Table
                </button>

                <span className="text-xs text-gray-400 ml-1">paste image with ⌘V</span>
              </div>
            )}

            {/* Table builder */}
            {tab === 'write' && showTable && (
              <div className="mb-2 p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 space-y-3">
                <div className="flex items-center gap-4 text-sm">
                  <label className="text-gray-600 dark:text-gray-300 font-medium">
                    Rows
                    <input type="number" min={2} max={10} value={tableRows}
                      onChange={e => changeTableSize(Number(e.target.value), tableCols)}
                      className="ml-2 w-14 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-center"
                    />
                  </label>
                  <label className="text-gray-600 dark:text-gray-300 font-medium">
                    Columns
                    <input type="number" min={1} max={8} value={tableCols}
                      onChange={e => changeTableSize(tableRows, Number(e.target.value))}
                      className="ml-2 w-14 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-center"
                    />
                  </label>
                </div>

                {/* Grid */}
                <div className="overflow-x-auto">
                  <table className="border-collapse w-full text-sm">
                    <tbody>
                      {tableData.map((row, r) => (
                        <tr key={r}>
                          {row.map((cell, c) => (
                            <td key={c} className="p-0.5">
                              <input
                                value={cell}
                                onChange={e => updateCell(r, c, e.target.value)}
                                placeholder={r === 0 ? `Header ${c + 1}` : `Row ${r}, Col ${c + 1}`}
                                className={`w-full px-2 py-1.5 rounded border text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                  r === 0
                                    ? 'border-blue-300 dark:border-blue-600 font-semibold'
                                    : 'border-gray-200 dark:border-gray-700'
                                }`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={handleInsertTable}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                    Insert Table
                  </button>
                  <button type="button" onClick={() => setShowTable(false)}
                    className="px-4 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {tab === 'write' ? (
              <textarea
                ref={textareaRef}
                value={body}
                onChange={e => setBody(e.target.value)}
                onPaste={handlePaste}
                rows={10}
                placeholder="Write your highlight here. Use the toolbar above for formatting."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono resize-y"
              />
            ) : (
              <div className="min-h-[200px] px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                {body.trim() ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkBreaks]} rehypePlugins={[rehypeRaw]}>{body}</ReactMarkdown>
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
