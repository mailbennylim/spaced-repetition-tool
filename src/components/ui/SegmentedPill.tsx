'use client';

interface Option<T extends string> { value: T; label: string }

interface Props<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  /** Floating above the tab bar (list screens). */
  floating?: boolean;
}

/** Floating segmented pill (docs/ux-spec.md §1.3): 44px, fully rounded, active segment filled. */
export default function SegmentedPill<T extends string>({ value, options, onChange, floating }: Props<T>) {
  const pill = (
    <div className="inline-flex h-11 items-center rounded-full bg-surface-1 p-1 shadow-pop">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`h-9 rounded-full px-5 text-[15px] font-medium transition-colors ${value === o.value ? 'bg-surface-active text-ink' : 'text-ink-2'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
  if (!floating) return pill;
  return (
    <div className="pointer-events-none fixed inset-x-0 z-30 flex justify-center" style={{ bottom: 'calc(var(--tabbar-h) + var(--safe-bottom) + 64px)' }}>
      <div className="pointer-events-auto">{pill}</div>
    </div>
  );
}
