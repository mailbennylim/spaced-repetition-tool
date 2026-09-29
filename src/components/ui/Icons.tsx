'use client';

/** Small type icons used in list rows (docs/ux-spec.md §3.2). */
import { FileText, BookOpen, Mail, Rss, Globe } from 'lucide-react';

export function TypeIcon({ type, size = 14 }: { type: string; size?: number }) {
  switch (type) {
    case 'epub': return <BookOpen size={size} />;
    case 'pdf': return <FileText size={size} />;
    case 'email': return <Mail size={size} />;
    case 'rss': return <Rss size={size} />;
    default: return <Globe size={size} />;
  }
}

export function typeLabel(type: string): string {
  switch (type) {
    case 'epub': return 'BOOK';
    case 'pdf': return 'PDF';
    case 'email': return 'EMAIL';
    case 'rss': return 'FEED';
    default: return 'ARTICLE';
  }
}

/** Favicon for a domain via DuckDuckGo's icon service (no account, works offline-cached by the browser). */
export function Favicon({ domain, size = 14 }: { domain: string; size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`https://icons.duckduckgo.com/ip3/${domain}.ico`} alt="" width={size} height={size} className="rounded-sm" loading="lazy" />;
}
