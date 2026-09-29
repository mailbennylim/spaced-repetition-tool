import { prisma } from '@/lib/prisma';
import { ReadwiseClient } from '@/lib/readwise';
import { domainOf, plainText } from '@/lib/format';
import { setDocumentTags } from '@/lib/documents';
import { isHighlightColor } from '@/lib/colors';

/**
 * One-time import from Readwise (docs/build-plan.md Phase 6):
 *  1. Reader documents (articles, emails, RSS items) with their HTML, location and tags → Documents
 *  2. Reader highlights → Highlights linked to those documents (colour kept)
 *  3. Everything else in Readwise (Kindle, books, PDFs…) → Highlights with title/author only
 * Safe to re-run: Readwise ids are stored as externalId / savedUsing.
 */

export interface ImportStatus {
  running: boolean;
  phase: string;
  documents: number;
  highlights: number;
  skipped: number;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

const status: ImportStatus = { running: false, phase: 'idle', documents: 0, highlights: 0, skipped: 0, error: null, startedAt: null, finishedAt: null };
export const getImportStatus = () => ({ ...status });

interface ReaderDoc {
  id: string; url: string | null; source_url: string | null; title: string | null; author: string | null; site_name: string | null;
  category: string; location: string; tags: Record<string, unknown> | string[] | null; word_count: number | null; created_at: string;
  published_date: string | number | null; summary: string | null; image_url: string | null; content?: string | null; html_content?: string | null;
  parent_id: string | null; reading_progress: number | null; first_opened_at: string | null; last_opened_at: string | null; saved_at: string; last_moved_at: string;
  notes?: string | null; color?: string | null;
}

async function* listReader(token: string, params: Record<string, string>): AsyncGenerator<ReaderDoc> {
  let cursor: string | null = null;
  do {
    const sp = new URLSearchParams(params); if (cursor) sp.set('pageCursor', cursor);
    const res = await fetch(`https://readwise.io/api/v3/list/?${sp}`, { headers: { Authorization: `Token ${token}` } });
    if (res.status === 429) { await new Promise(r => setTimeout(r, Number(res.headers.get('Retry-After') || 10) * 1000)); continue; }
    if (!res.ok) throw new Error(`Reader API ${res.status}`);
    const data = await res.json();
    for (const d of data.results ?? []) yield d as ReaderDoc;
    cursor = data.nextPageCursor ?? null;
  } while (cursor);
}

const tagNames = (t: ReaderDoc['tags']) => (Array.isArray(t) ? t : Object.keys(t ?? {})).map(String).filter(Boolean);

export async function runReadwiseImport(token: string) {
  if (status.running) return;
  Object.assign(status, { running: true, phase: 'Starting', documents: 0, highlights: 0, skipped: 0, error: null, startedAt: new Date().toISOString(), finishedAt: null });
  try {
    const source = (await prisma.source.findFirst({ where: { type: 'readwise' } })) ?? (await prisma.source.create({ data: { name: 'Readwise', type: 'readwise' } }));
    const idMap = new Map<string, string>(); // Readwise doc id → our document id

    // ── 1. Reader documents ────────────────────────────────────────────────
    for (const category of ['article', 'email', 'rss']) {
      status.phase = `Importing ${category}s`;
      for await (const d of listReader(token, { category, withHtmlContent: 'true' })) {
        const existing = await prisma.document.findFirst({ where: { savedUsing: `readwise:${d.id}` }, select: { id: true } });
        if (existing) { idMap.set(d.id, existing.id); status.skipped++; continue; }
        const html = d.html_content || d.content || '';
        const text = plainText(html);
        const url = d.source_url || d.url;
        const doc = await prisma.document.create({
          data: {
            title: d.title?.trim() || 'Untitled',
            author: d.author || null,
            type: category,
            url,
            domain: domainOf(url),
            siteName: d.site_name || null,
            excerpt: (d.summary || text).slice(0, 280) || null,
            content: html || null,
            imageUrl: d.image_url || null,
            wordCount: d.word_count || (text ? text.split(' ').length : null),
            publishedAt: d.published_date ? new Date(d.published_date) : null,
            isFeed: d.location === 'feed',
            seen: d.location !== 'feed' || !!d.first_opened_at,
            location: d.location === 'archive' ? 'archive' : 'inbox',
            progress: Math.min(1, Math.max(0, d.reading_progress ?? 0)),
            lastOpenedAt: d.last_opened_at ? new Date(d.last_opened_at) : null,
            savedUsing: `readwise:${d.id}`,
            savedAt: new Date(d.saved_at || d.created_at),
            movedAt: new Date(d.last_moved_at || d.saved_at || d.created_at),
          },
        });
        const tags = tagNames(d.tags);
        if (tags.length) await setDocumentTags(doc.id, tags);
        idMap.set(d.id, doc.id);
        status.documents++;
      }
    }

    // Titles for documents we didn't import (books, PDFs, tweets…) so their highlights keep a source name
    status.phase = 'Reading other documents';
    const otherTitles = new Map<string, { title: string; author: string | null; url: string | null }>();
    for await (const d of listReader(token, { category: 'pdf' })) otherTitles.set(d.id, { title: d.title || 'Untitled', author: d.author, url: d.source_url || d.url });
    for await (const d of listReader(token, { category: 'epub' })) otherTitles.set(d.id, { title: d.title || 'Untitled', author: d.author, url: d.source_url || d.url });

    // ── 2. Reader highlights ───────────────────────────────────────────────
    status.phase = 'Importing Reader highlights';
    for await (const h of listReader(token, { category: 'highlight' })) {
      const exists = await prisma.highlight.findUnique({ where: { sourceId_externalId: { sourceId: source.id, externalId: `reader:${h.id}` } } });
      if (exists) { status.skipped++; continue; }
      const text = plainText(h.content || h.html_content || h.title || '');
      if (!text) continue;
      const parent = h.parent_id ? idMap.get(h.parent_id) : undefined;
      const other = h.parent_id ? otherTitles.get(h.parent_id) : undefined;
      const parentDoc = parent ? await prisma.document.findUnique({ where: { id: parent }, select: { title: true, author: true, url: true } }) : null;
      const created = await prisma.highlight.create({
        data: {
          sourceId: source.id,
          externalId: `reader:${h.id}`,
          documentId: parent ?? null,
          text,
          note: h.notes?.trim() || null,
          color: isHighlightColor(h.color) ? h.color : 'yellow',
          title: parentDoc?.title ?? other?.title ?? h.title ?? null,
          author: parentDoc?.author ?? other?.author ?? h.author ?? null,
          url: parentDoc?.url ?? other?.url ?? h.source_url ?? null,
          tags: tagNames(h.tags).join(', ') || null,
          highlightedAt: new Date(h.created_at),
        },
      });
      await prisma.reviewSchedule.create({ data: { highlightId: created.id, scheduledFor: new Date(), interval: 30 } });
      status.highlights++;
    }

    // ── 3. Everything else in Readwise (Kindle, Apple Books, manual…) ─────
    status.phase = 'Importing other Readwise highlights';
    const client = new ReadwiseClient(token);
    const [highlights, books] = await Promise.all([client.fetchHighlights(1000), client.fetchBooks()]);
    const bookMap = new Map(books.map(b => [b.id, b]));
    for (const h of highlights) {
      const book = h.book_id ? bookMap.get(h.book_id) : undefined;
      if (book?.source && /reader|readwise_web/i.test(book.source)) continue; // already covered by Reader highlights
      const externalId = String(h.id);
      const exists = await prisma.highlight.findUnique({ where: { sourceId_externalId: { sourceId: source.id, externalId } } });
      if (exists) { status.skipped++; continue; }
      const created = await prisma.highlight.create({
        data: {
          sourceId: source.id, externalId, text: h.text, note: h.note || null,
          title: book?.title ?? null, author: book?.author ?? null, url: h.url || book?.source_url || null,
          tags: h.tags?.map(t => t.name).join(', ') || null,
          highlightedAt: h.highlighted_at ? new Date(h.highlighted_at) : new Date(h.updated),
        },
      });
      await prisma.reviewSchedule.create({ data: { highlightId: created.id, scheduledFor: new Date(), interval: 30 } });
      status.highlights++;
    }

    await prisma.source.update({ where: { id: source.id }, data: { lastSyncAt: new Date() } });
    status.phase = 'Done';
  } catch (e) {
    status.error = e instanceof Error ? e.message : 'Import failed';
    status.phase = 'Failed';
  } finally {
    status.running = false;
    status.finishedAt = new Date().toISOString();
  }
}
