import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Browse highlights (docs/ux-spec.md §3.7.4).
 *  ?group=document       → one row per source document with counts
 *  ?group=color          → counts per colour
 *  ?documentId= | ?title= | ?color= | ?q=   → highlight list (newest first), ?limit=
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const group = sp.get('group');

    if (group === 'color') {
      const rows = await prisma.highlight.groupBy({ by: ['color'], _count: { _all: true } });
      return NextResponse.json(rows.map(r => ({ color: r.color, count: r._count._all })));
    }

    if (group === 'document') {
      const rows = await prisma.highlight.findMany({
        select: { documentId: true, title: true, author: true, createdAt: true, document: { select: { id: true, title: true, author: true, coverImage: true, imageUrl: true, type: true } } },
        orderBy: { createdAt: 'desc' },
      });
      const map = new Map<string, { key: string; documentId: string | null; title: string; author: string | null; image: string | null; type: string | null; count: number; last: string }>();
      for (const r of rows) {
        const key = r.documentId ?? `t:${r.title ?? 'Untitled'}`;
        const cur = map.get(key);
        if (cur) { cur.count++; continue; }
        map.set(key, { key, documentId: r.documentId, title: r.document?.title ?? r.title ?? 'Untitled', author: r.document?.author ?? r.author, image: r.document?.coverImage ?? r.document?.imageUrl ?? null, type: r.document?.type ?? null, count: 1, last: r.createdAt.toISOString() });
      }
      return NextResponse.json([...map.values()]);
    }

    const where: Prisma.HighlightWhereInput = {};
    if (sp.get('documentId')) where.documentId = sp.get('documentId')!;
    if (sp.get('title')) where.title = sp.get('title')!;
    if (sp.get('color')) where.color = sp.get('color')!;
    if (sp.get('q')) where.OR = [{ text: { contains: sp.get('q')! } }, { note: { contains: sp.get('q')! } }];
    const limit = Math.min(500, Number(sp.get('limit')) || 100);
    const highlights = await prisma.highlight.findMany({
      where,
      include: { document: { select: { id: true, title: true, coverImage: true, imageUrl: true, type: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return NextResponse.json(highlights);
  } catch (error) {
    console.error('Highlights list error:', error);
    return NextResponse.json({ error: 'Failed to fetch highlights' }, { status: 500 });
  }
}
