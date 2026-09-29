import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const folders = await prisma.feedFolder.findMany({ include: { _count: { select: { feeds: true } } }, orderBy: { name: 'asc' } });
  return NextResponse.json(folders.map(f => ({ id: f.id, name: f.name, feeds: f._count.feeds })));
}

/** { name } creates; { id, name } renames; { id, delete: true } removes (feeds stay, unfoldered). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.delete) { await prisma.feedFolder.delete({ where: { id: body.id } }); return NextResponse.json({ success: true }); }
    const name = String(body.name ?? '').trim();
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    const folder = body.id ? await prisma.feedFolder.update({ where: { id: body.id }, data: { name } }) : await prisma.feedFolder.upsert({ where: { name }, update: {}, create: { name } });
    return NextResponse.json(folder);
  } catch (error) {
    console.error('Folders POST error:', error);
    return NextResponse.json({ error: 'Failed to save folder' }, { status: 500 });
  }
}
