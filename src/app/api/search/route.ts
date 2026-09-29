import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { summaryInclude, toSummary } from '@/lib/documents';
import { plainText } from '@/lib/format';
import { parseFilterQuery } from '@/lib/filter-query';

/**
 * Search (docs/ux-spec.md §3.8): ?q=words searches documents (title, author, full text) and highlights (text, note).
 * ?filter=<query> runs a filtered view instead.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  try {
    if (sp.get('filter')) {
      const where = parseFilterQuery(sp.get('filter')!);
      const docs = await prisma.document.findMany({ where: { AND: [{ deletedAt: null }, where] }, include: summaryInclude, orderBy: { savedAt: 'desc' }, take: 200 });
      return NextResponse.json({ documents: docs.map(toSummary), highlights: [], snippets: {} });
    }

    const q = (sp.get('q') ?? '').trim();
    if (q.length < 2) return NextResponse.json({ documents: [], highlights: [], snippets: {} });
    const like = `%${q.replace(/[%_]/g, m => '\\' + m)}%`;

    // SQLite LIKE is case-insensitive for ASCII, which is what we want here.
    const idRows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM Document
      WHERE deletedAt IS NULL AND (title LIKE ${like} ESCAPE '\\' OR author LIKE ${like} ESCAPE '\\' OR content LIKE ${like} ESCAPE '\\' OR note LIKE ${like} ESCAPE '\\')
      ORDER BY CASE WHEN title LIKE ${like} ESCAPE '\\' THEN 0 ELSE 1 END, savedAt DESC LIMIT 60`;
    const ids = idRows.map(r => r.id);
    const docs = ids.length ? await prisma.document.findMany({ where: { id: { in: ids } }, include: summaryInclude }) : [];
    const byId = new Map(docs.map(d => [d.id, d]));
    const ordered = ids.map(id => byId.get(id)!).filter(Boolean);

    // Snippet around the first match in the body
    const snippets: Record<string, string> = {};
    const lower = q.toLowerCase();
    for (const d of ordered) {
      const text = plainText(d.content);
      const i = text.toLowerCase().indexOf(lower);
      if (i >= 0) snippets[d.id] = (i > 60 ? '…' : '') + text.slice(Math.max(0, i - 60), i + q.length + 90) + '…';
    }

    const highlights = await prisma.highlight.findMany({
      where: { OR: [{ text: { contains: q } }, { note: { contains: q } }] },
      include: { document: { select: { id: true, title: true, coverImage: true, imageUrl: true, type: true } } },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });

    return NextResponse.json({ documents: ordered.map(toSummary), highlights, snippets });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Search failed' }, { status: 400 });
  }
}
