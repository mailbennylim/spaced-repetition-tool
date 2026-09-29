'use client';

import { Check } from 'lucide-react';
import Sheet, { SheetGroup, SheetRow } from '@/components/ui/Sheet';
import type { SortKey } from '@/lib/documents';

export interface SortState { sort: SortKey; order: 'asc' | 'desc' }

const SORT_LABELS: [SortKey, string][] = [
  ['saved', 'Date saved'],
  ['published', 'Date published'],
  ['opened', 'Date last opened'],
  ['title', 'Title'],
  ['author', 'Author'],
  ['length', 'Length'],
  ['progress', 'Progress'],
  ['random', 'Random'],
];

/** Sort documents sheet (docs/ux-spec.md §3.2). */
export default function SortSheet({ open, onClose, value, onChange }: { open: boolean; onClose: () => void; value: SortState; onChange: (v: SortState) => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Sort documents">
      <p className="mb-2 px-1 text-[12px] uppercase tracking-wide text-ink-2">Sort by</p>
      <SheetGroup>
        {SORT_LABELS.map(([k, label]) => (
          <SheetRow key={k} label={label} right={value.sort === k ? <Check size={18} className="text-accent" /> : undefined} onClick={() => onChange({ ...value, sort: k })} />
        ))}
      </SheetGroup>
      {value.sort !== 'random' && (
        <>
          <p className="mb-2 px-1 text-[12px] uppercase tracking-wide text-ink-2">Order by</p>
          <SheetGroup>
            <SheetRow label="Recent → Old" right={value.order === 'desc' ? <Check size={18} className="text-accent" /> : undefined} onClick={() => onChange({ ...value, order: 'desc' })} />
            <SheetRow label="Old → Recent" right={value.order === 'asc' ? <Check size={18} className="text-accent" /> : undefined} onClick={() => onChange({ ...value, order: 'asc' })} />
          </SheetGroup>
        </>
      )}
    </Sheet>
  );
}
