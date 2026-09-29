import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { extractArticle } from '@/lib/article-extract';
import { extractEpubCover, extractPdfCover } from '@/lib/cover-extract';
import { domainOf, plainText } from '@/lib/format';
import { summaryInclude, toSummary, setDocumentTags, type DocumentSummary } from '@/lib/documents';

export interface SaveUrlOptions {
  url: string;
  savedUsing?: string;
  location?: 'inbox' | 'archive';
  tags?: string[];
  note?: string;
}

function normalizeUrl(raw: string): string {
  let u = raw.trim();
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  const url = new URL(u);
  // Drop common tracking params so re-saves match.
  [...url.searchParams.keys()].forEach(k => { if (/^(utm_|fbclid|gclid|mc_cid|mc_eid|ref$)/i.test(k)) url.searchParams.delete(k); });
  url.hash = '';
  return url.toString();
}

/** Save a web page. Re-saving an existing URL bumps it to the top of Inbox (docs/ux-spec.md §4.1). */
export async function saveUrl(opts: SaveUrlOptions): Promise<{ doc: DocumentSummary; existed: boolean }> {
  const url = normalizeUrl(opts.url);
  const existing = await prisma.document.findFirst({ where: { url, isFeed: false } });
  if (existing) {
    const doc = await prisma.document.update({
      where: { id: existing.id },
      data: { deletedAt: null, location: opts.location ?? 'inbox', movedAt: new Date(), seen: false },
      include: summaryInclude,
    });
    if (opts.tags?.length) await setDocumentTags(doc.id, [...doc.tags.map(t => t.tag.name), ...opts.tags]);
    return { doc: toSummary(doc), existed: true };
  }

  const article = await extractArticle(url);
  const text = plainText(article.content);
  const doc = await prisma.document.create({
    data: {
      title: article.title,
      author: article.byline,
      type: 'article',
      url,
      domain: domainOf(url),
      siteName: article.siteName,
      excerpt: article.excerpt || text.slice(0, 280),
      content: article.content,
      imageUrl: article.ogImage,
      wordCount: text ? text.split(' ').length : null,
      publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
      location: opts.location ?? 'inbox',
      savedUsing: opts.savedUsing ?? 'app',
      note: opts.note || null,
    },
    include: summaryInclude,
  });
  if (opts.tags?.length) await setDocumentTags(doc.id, opts.tags);
  const fresh = await prisma.document.findUniqueOrThrow({ where: { id: doc.id }, include: summaryInclude });
  return { doc: toSummary(fresh), existed: false };
}

export async function saveUpload(file: File, savedUsing = 'app'): Promise<DocumentSummary> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !['epub', 'pdf', 'md', 'markdown', 'txt'].includes(ext)) throw new Error('Only EPUB, PDF and Markdown files are supported');

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadsDir, { recursive: true });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const title = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();

  if (ext === 'md' || ext === 'markdown' || ext === 'txt') {
    const { marked } = await import('marked');
    const md = buffer.toString('utf8');
    const html = await marked.parse(md);
    const text = plainText(html);
    const doc = await prisma.document.create({
      data: { title, type: 'article', content: html, excerpt: text.slice(0, 280), wordCount: text.split(' ').length, savedUsing, location: 'inbox' },
      include: summaryInclude,
    });
    return toSummary(doc);
  }

  await writeFile(path.join(uploadsDir, filename), buffer);
  const filePath = `/uploads/${filename}`;
  const coverImage = ext === 'epub' ? await extractEpubCover(filePath) : await extractPdfCover(filePath).catch(() => null);
  const doc = await prisma.document.create({
    data: { title, type: ext, filePath, coverImage, savedUsing, location: 'inbox' },
    include: summaryInclude,
  });
  return toSummary(doc);
}
