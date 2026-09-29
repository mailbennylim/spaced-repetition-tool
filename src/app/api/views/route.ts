import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseFilterQuery, DEFAULT_VIEWS } from '@/lib/filter-query';

/** Saved filtered views (docs/ux-spec.md §3.8). Seeds the defaults on first use. */
export async function GET() {
  try {
    let views = await prisma.savedView.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    if (views.length === 0) {
      await prisma.savedView.createMany({ data: DEFAULT_VIEWS.map((v, i) => ({ ...v, sortOrder: i })) });
      views = await prisma.savedView.findMany({ orderBy: [{ sortOrder: 'asc' }] });
    }
    return NextResponse.json(views);
  } catch (error) {
    console.error('Views GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch views' }, { status: 500 });
  }
}

/** { name, query } creates · { id, name?, query?, pinned? } updates · { id, delete: true } removes. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.delete) { await prisma.savedView.delete({ where: { id: body.id } }); return NextResponse.json({ success: true }); }
    if (body.query !== undefined) parseFilterQuery(String(body.query)); // validate
    if (body.id) {
      const data: Record<string, unknown> = {};
      if (typeof body.name === 'string') data.name = body.name.trim();
      if (typeof body.query === 'string') data.query = body.query.trim();
      if (typeof body.pinned === 'boolean') data.pinned = body.pinned;
      return NextResponse.json(await prisma.savedView.update({ where: { id: body.id }, data }));
    }
    const name = String(body.name ?? '').trim(), query = String(body.query ?? '').trim();
    if (!name || !query) return NextResponse.json({ error: 'Name and query required' }, { status: 400 });
    const count = await prisma.savedView.count();
    return NextResponse.json(await prisma.savedView.create({ data: { name, query, sortOrder: count } }), { status: 201 });
  } catch (error) {
    console.error('Views POST error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid query' }, { status: 400 });
  }
}
