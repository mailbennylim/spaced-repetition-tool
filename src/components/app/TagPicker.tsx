'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Tag as TagIcon, Check, Plus } from 'lucide-react';

interface TagInfo { id: string; name: string; count: number }

interface Props {
  selected: string[];
  onChange: (tags: string[]) => void;
  autoFocus?: boolean;
}

/**
 * Document tag picker (docs/ux-spec.md §3.10): search field "Select or enter a tag…",
 * then every tag as a row with a tag icon. Tap toggles. Typing a new name offers Create.
 */
export default function TagPicker({ selected, onChange, autoFocus }: Props) {
  const [all, setAll] = useState<TagInfo[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => { fetch('/api/tags').then(r => r.json()).then(setAll).catch(() => {}); }, []);

  const shown = useMemo(() => {
    const names = new Set([...all.map(t => t.name), ...selected]);
    const list = [...names].sort((a, b) => a.localeCompare(b));
    const query = q.trim().toLowerCase();
    return query ? list.filter(n => n.toLowerCase().includes(query)) : list;
  }, [all, selected, q]);

  const exact = shown.some(n => n.toLowerCase() === q.trim().toLowerCase());
  const toggle = (name: string) => onChange(selected.includes(name) ? selected.filter(t => t !== name) : [...selected, name]);
  const create = () => { const name = q.trim(); if (!name) return; if (!selected.includes(name)) onChange([...selected, name]); setQ(''); };

  return (
    <div>
      <div className="mb-3 flex h-11 items-center gap-2 rounded-group bg-surface-group px-3">
        <Search size={18} className="text-ink-2" />
        <input
          autoFocus={autoFocus}
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (!exact) create(); else toggle(shown.find(n => n.toLowerCase() === q.trim().toLowerCase())!); } }}
          placeholder="Select or enter a tag..."
          className="w-full bg-transparent text-[16px] text-ink placeholder:text-ink-2 focus:outline-none"
        />
      </div>
      <ul>
        {q.trim() && !exact && (
          <li>
            <button onClick={create} className="flex h-11 w-full items-center gap-3 px-1 text-left text-[15px] text-accent">
              <Plus size={16} /> Create &ldquo;{q.trim()}&rdquo;
            </button>
          </li>
        )}
        {shown.map(name => {
          const on = selected.includes(name);
          return (
            <li key={name}>
              <button onClick={() => toggle(name)} className="flex h-11 w-full items-center gap-3 px-1 text-left text-[15px] text-ink">
                <TagIcon size={16} className={on ? 'text-accent' : 'text-ink-2'} />
                <span className="flex-1 truncate">{name}</span>
                {on && <Check size={18} className="text-accent" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
