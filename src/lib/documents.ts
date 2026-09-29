import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const DOC_TYPES = ['article', 'epub', 'pdf', 'email', 'rss'] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const SORTS = ['saved', 'moved', 'published', 'opened', 'title', 'author', 'length', 'progress', 'random'] as const;
export type SortKey = (typeof SORTS)[number];

export interface DocumentSummary {
  id: string;
  title: string;
  author: string | null;
  type: string;
  url: string | null;
  domain: string | null;
  siteName: string | null;
  excerpt: string | null;
  image: string | null;
  wordCount: number | null;
  progress: number;
  location: string;
  isFeed: boolean;
  seen: boolean;
  savedAt: string;
  movedAt: string;
  publishedAt: string | null;
  lastOpenedAt: string | null;
  deletedAt: string | null;
  note: string | null;
  tags: string[];
  highlightCount: number;
  feedTitle: string | null;
}

export const summaryInclude = {
  tags: { include: { tag: true }, orderBy: { createdAt: 'asc' } },
  feed: { select: { title: true } },
  _count: { select: { highlights: true } },
} satisfies Prisma.DocumentInclude;

type DocWithSummary = Prisma.DocumentGetPayload<{ include: typeof summaryInclude }>;

export function toSummary(d: DocWithSummary): DocumentSummary {
  return {
    id: d.id,
    title: d.title,
    author: d.author,
    type: d.type,
    url: d.url,
    domain: d.domain,
    siteName: d.siteName,
    excerpt: d.excerpt,
    image: d.coverImage || d.imageUrl,
    wordCount: d.wordCount,
    progress: d.progress,
    location: d.location,
    isFeed: d.isFeed,
    seen: d.seen,
    savedAt: d.savedAt.toISOString(),
    movedAt: d.movedAt.toISOString(),
    publishedAt: d.publishedAt?.toISOString() ?? null,
    lastOpenedAt: d.lastOpenedAt?.toISOString() ?? null,
    deletedAt: d.deletedAt?.toISOString() ?? null,
    note: d.note,
    tags: d.tags.map(t => t.tag.name),
    highlightCount: d._count.highlights,
    feedTitle: d.feed?.title ?? null,
  };
}

export interface ListQuery {
  scope?: 'library' | 'feed' | 'trash' | 'all';
  location?: 'inbox' | 'archive';
  seen?: boolean;
  type?: string;
  tag?: string;
  feedId?: string;
  /** Feed folder name (documents from every feed in that folder). */
  folder?: string;
  /** Only documents that have been started (progress > 2%) and not finished. */
  started?: boolean;
  /** Only documents with at least one highlight. */
  hasHighlights?: boolean;
  sort?: SortKey;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export function parseListQuery(sp: URLSearchParams): ListQuery {
  const scope = sp.get('scope') as ListQuery['scope'];
  const location = sp.get('location') as ListQuery['location'];
  const seen = sp.get('seen');
  const sort = sp.get('sort') as SortKey | null;
  return {
    scope: scope && ['library', 'feed', 'trash', 'all'].includes(scope) ? scope : 'library',
    location: location === 'archive' || location === 'inbox' ? location : undefined,
    seen: seen === 'true' ? true : seen === 'false' ? false : undefined,
    type: sp.get('type') || undefined,
    tag: sp.get('tag') || undefined,
    feedId: sp.get('feedId') || undefined,
    folder: sp.get('folder') || undefined,
    started: sp.get('started') === '1' || undefined,
    hasHighlights: sp.get('hasHighlights') === '1' || undefined,
    sort: sort && (SORTS as readonly string[]).includes(sort) ? sort : undefined,
    order: sp.get('order') === 'asc' ? 'asc' : 'desc',
    limit: Math.min(200, Number(sp.get('limit')) || 60),
    offset: Number(sp.get('offset')) || 0,
  };
}

export function buildWhere(q: ListQuery): Prisma.DocumentWhereInput {
  const where: Prisma.DocumentWhereInput = {};
  if (q.scope === 'trash') where.deletedAt = { not: null };
  else {
    where.deletedAt = null;
    if (q.scope === 'library') where.isFeed = false;
    if (q.scope === 'feed') where.isFeed = true;
  }
  if (q.location) where.location = q.location;
  if (q.seen !== undefined) where.seen = q.seen;
  if (q.type) where.type = q.type === 'book' ? 'epub' : q.type;
  if (q.tag) where.tags = { some: { tag: { name: q.tag } } };
  if (q.feedId) where.feedId = q.feedId;
  if (q.folder) where.feed = { folder: { name: q.folder } };
  if (q.started) { where.progress = { gt: 0.02, lt: 0.98 }; where.lastOpenedAt = { not: null }; }
  if (q.hasHighlights) where.highlights = { some: {} };
  return where;
}

function orderBy(q: ListQuery): Prisma.DocumentOrderByWithRelationInput[] {
  const dir = q.order ?? 'desc';
  const flip = dir === 'desc' ? 'asc' : 'desc';
  switch (q.sort) {
    case 'published': return [{ publishedAt: { sort: dir, nulls: 'last' } }, { savedAt: dir }];
    case 'opened': return [{ lastOpenedAt: { sort: dir, nulls: 'last' } }];
    // "Recent → Old" on text fields reads as A→Z first, like Reader.
    case 'title': return [{ title: flip }];
    case 'author': return [{ author: { sort: flip, nulls: 'last' } }];
    case 'length': return [{ wordCount: { sort: dir, nulls: 'last' } }];
    case 'progress': return [{ progress: dir }];
    case 'moved': return [{ movedAt: dir }];
    case 'saved':
    default: return [{ savedAt: dir }];
  }
}

export async function listDocuments(q: ListQuery): Promise<{ items: DocumentSummary[]; total: number }> {
  const where = buildWhere(q);
  if (q.sort === 'random') {
    const all = await prisma.document.findMany({ where, include: summaryInclude });
    for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
    return { items: all.slice(q.offset, (q.offset ?? 0) + (q.limit ?? 60)).map(toSummary), total: all.length };
  }
  const [rows, total] = await Promise.all([
    prisma.document.findMany({ where, include: summaryInclude, orderBy: orderBy(q), skip: q.offset, take: q.limit }),
    prisma.document.count({ where }),
  ]);
  return { items: rows.map(toSummary), total };
}

/** The document shown in the "Continue: …" bar: most recently opened, started, not finished. */
export async function continueDocument(): Promise<DocumentSummary | null> {
  const d = await prisma.document.findFirst({
    where: { deletedAt: null, lastOpenedAt: { not: null }, progress: { lt: 0.98 } },
    orderBy: { lastOpenedAt: 'desc' },
    include: summaryInclude,
  });
  return d ? toSummary(d) : null;
}

export async function setDocumentTags(documentId: string, names: string[]) {
  const clean = [...new Set(names.map(n => n.trim()).filter(Boolean))];
  const tags = await Promise.all(clean.map(name => prisma.tag.upsert({ where: { name }, update: {}, create: { name } })));
  await prisma.$transaction([
    prisma.documentTag.deleteMany({ where: { documentId, tagId: { notIn: tags.map(t => t.id) } } }),
    ...tags.map(t => prisma.documentTag.upsert({
      where: { documentId_tagId: { documentId, tagId: t.id } },
      update: {},
      create: { documentId, tagId: t.id },
    })),
  ]);
}
