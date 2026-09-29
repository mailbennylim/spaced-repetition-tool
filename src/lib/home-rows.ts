export interface HomeRowDef { id: string; title: string; query: string }

/** Home rows are filtered views (docs/ux-spec.md §3.1). Order is user-configurable in Settings. */
export const HOME_ROWS: HomeRowDef[] = [
  { id: 'continue', title: '📖 Continue reading', query: 'scope=library&location=inbox&sort=opened&started=1' },
  { id: 'recent', title: '📥 Recently added', query: 'scope=library&location=inbox&sort=saved' },
  { id: 'feed', title: '✨ New in Feed', query: 'scope=feed&seen=false&sort=saved' },
  { id: 'highlighted', title: '💎 Recently highlighted', query: 'scope=library&hasHighlights=1&sort=opened' },
  { id: 'books', title: 'Books', query: 'scope=library&type=epub&sort=saved' },
  { id: 'pdfs', title: 'PDFs', query: 'scope=library&type=pdf&sort=saved' },
];
