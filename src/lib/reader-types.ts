import type { DocumentSummary } from '@/lib/documents';

export interface HighlightRecord {
  id: string;
  documentId: string | null;
  kind: string;
  text: string;
  imageUrl: string | null;
  note: string | null;
  color: string;
  position: string | null;
  createdAt: string;
}

export interface ReaderDocument extends DocumentSummary {
  content: string | null;
  filePath: string | null;
  position: string | null;
  highlights: HighlightRecord[];
}

export interface ReaderSettings {
  autoHighlight: boolean;
  autoAdvance: boolean;
  defaultColor: string;
  readerFont: string;
  readerFontSize: number;
  readerLineHeight: number;
  readerLineWidth: string;
  ttsVoice: string | null;
  ttsRate: number;
}

/** A pending selection in any reader, before it becomes a highlight. */
export interface PendingSelection {
  text: string;
  /** Reader-specific anchor (offsets / cfi / page rects). */
  position: unknown;
  /** Screen y of the selection's middle, to place the vertical toolbar. */
  y: number;
}

/** What the readers hand to the shared chrome when the user taps an existing highlight. */
export interface ActiveHighlight {
  id: string;
  y: number;
}

export interface TocItem {
  id: string;
  label: string;
  level: number;
  /** Anchor the reader knows how to jump to (element id, cfi href, page number). */
  target: string | number;
}

/** Things each reader exposes to the chrome. */
export interface ReaderHandle {
  jumpTo: (target: string | number) => void;
  /** Paragraph texts for Listen, with a way to scroll to / mark one. */
  getParagraphs: () => { id: string; text: string }[];
  scrollToParagraph: (id: string) => void;
  setSpokenRange: (paragraphId: string | null, start?: number, end?: number) => void;
  /** Return to the furthest-read position. */
  returnToProgress: () => void;
  /** Find in document: returns match count; findNext returns the new index. */
  find: (query: string) => number;
  findNext: (dir: 1 | -1) => number;
}

/** Props every reader accepts from the reading page. */
export interface ReaderProps {
  doc: ReaderDocument;
  highlights: HighlightRecord[];
  settings: ReaderSettings;
  activeHighlightId: string | null;
  onPending: (sel: PendingSelection | null) => void;
  onActive: (h: ActiveHighlight | null) => void;
  onProgress: (progress: number, position: unknown) => void;
  onToc: (items: TocItem[]) => void;
  onCurrentToc: (id: string | null) => void;
  onTap: () => void;
  registerHandle: (h: ReaderHandle) => void;
}

export const FONT_OPTIONS = [
  { id: 'serif', label: 'Source Serif', css: 'var(--font-serif), "Source Serif 4", Georgia, serif' },
  { id: 'sans', label: 'Inter', css: 'var(--font-inter), Inter, system-ui, sans-serif' },
  { id: 'georgia', label: 'Georgia', css: 'Georgia, "Times New Roman", serif' },
  { id: 'system', label: 'System', css: 'system-ui, -apple-system, Roboto, sans-serif' },
];

export const LINE_WIDTHS: Record<string, number> = { narrow: 560, medium: 680, wide: 820 };
