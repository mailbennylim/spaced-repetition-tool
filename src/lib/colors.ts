// Highlight colours (docs/ux-spec.md §3.6)
export const HIGHLIGHT_COLORS = [
  { id: 'yellow', label: 'Yellow', hue: 50 },
  { id: 'green', label: 'Green', hue: 140 },
  { id: 'blue', label: 'Blue', hue: 210 },
  { id: 'pink', label: 'Pink', hue: 330 },
  { id: 'purple', label: 'Purple', hue: 270 },
] as const;

export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number]['id'];

export function isHighlightColor(c: unknown): c is HighlightColor {
  return HIGHLIGHT_COLORS.some(x => x.id === c);
}

export function colorSolid(id: string, alpha = 1): string {
  const hue = HIGHLIGHT_COLORS.find(c => c.id === id)?.hue ?? 50;
  return `hsl(${hue} 100% 50% / ${alpha})`;
}
