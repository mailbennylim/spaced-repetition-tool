'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Library, Rss, RefreshCw, Search } from 'lucide-react';

const TABS = [
  { href: '/', label: 'Home', icon: Home, match: (p: string) => p === '/' },
  { href: '/library', label: 'Library', icon: Library, match: (p: string) => p.startsWith('/library') },
  { href: '/feed', label: 'Feed', icon: Rss, match: (p: string) => p.startsWith('/feed') },
  { href: '/review', label: 'Review', icon: RefreshCw, match: (p: string) => p.startsWith('/review') },
  { href: '/search', label: 'Search', icon: Search, match: (p: string) => p.startsWith('/search') },
];

/** Bottom tab bar (docs/ux-spec.md §2.1). Hidden on the reading view and in a review session. */
export default function TabBar({ dueCount = 0 }: { dueCount?: number }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-1 bg-bg pb-safe" aria-label="Main">
      <div className="mx-auto grid h-[var(--tabbar-h)] max-w-2xl grid-cols-5">
        {TABS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link key={href} href={href} className={`relative flex flex-col items-center justify-center gap-1 ${active ? 'text-accent' : 'text-ink-2'}`}>
              <Icon size={24} strokeWidth={active ? 2 : 1.75} />
              <span className="text-[11px]">{label}</span>
              {label === 'Review' && dueCount > 0 && (
                <span className="absolute left-1/2 top-2 ml-2 min-w-[16px] rounded-full bg-accent px-1 text-center text-[10px] font-semibold leading-4 text-bg">{dueCount}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
