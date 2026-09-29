import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Document tags with counts, most used first. */
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      include: { _count: { select: { documents: true } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(tags.map(t => ({ id: t.id, name: t.name, count: t._count.documents })));
  } catch (error) {
    console.error('Tags GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

/** Rename or delete a tag: { id, name } renames; { id, delete: true } removes it. */
export async function PATCH(request: NextRequest) {
  try {
    const { id, name, delete: del } = await request.json();
    if (del) { await prisma.tag.delete({ where: { id } }); return NextResponse.json({ success: true }); }
    const tag = await prisma.tag.update({ where: { id }, data: { name: String(name).trim() } });
    return NextResponse.json(tag);
  } catch (error) {
    console.error('Tags PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
  }
}
