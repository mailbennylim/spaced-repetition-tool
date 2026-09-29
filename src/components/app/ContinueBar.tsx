'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import type { DocumentSummary } from '@/lib/documents';
import { Thumb } from '@/components/app/DocumentRow';

/** "Continue: <title> ⊗" bar above the tab bar (docs/ux-spec.md §2.1). */
export default function ContinueBar() {
  const [doc, setDoc] = useState<DocumentSummary | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    fetch('/api/documents/continue').then(r => r.json()).then(d => {
      if (!d) return;
      try { if (sessionStorage.getItem('continue-dismissed') === d.id) return; } catch {}
      setDoc(d);
    }).catch(() => {});
  }, []);

  if (!doc || hidden) return null;
  return (
    <div className="fixed inset-x-0 z-30 mx-auto flex max-w-2xl items-center gap-3 border-t border-surface-1 bg-surface-1 px-3 py-2" style={{ bottom: 'calc(var(--tabbar-h) + var(--safe-bottom))' }}>
      <Link href={`/read/${doc.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Thumb doc={doc} size={28} />
        <p className="truncate text-[14px] text-ink"><span className="text-ink-2">Continue: </span>{doc.title}</p>
      </Link>
      <button
        onClick={() => { setHidden(true); try { sessionStorage.setItem('continue-dismissed', doc.id); } catch {} }}
        aria-label="Dismiss"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-group text-ink"
      >
        <X size={14} />
      </button>
    </div>
  );
}
