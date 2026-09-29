import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { refreshFeed } from '@/lib/rss';

type Ctx = { params: Promise<{ id: string }> };

/** Rename / move to folder / refresh: { title?, folderId?: string|null, refresh?: true } */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
    if (body.folderId !== undefined) data.folderId = body.folderId || null;
    const feed = await prisma.feed.update({ where: { id }, data });
    const added = body.refresh ? await refreshFeed(id) : 0;
    return NextResponse.json({ ...feed, added });
  } catch (error) {
    console.error('Feed PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update feed' }, { status: 500 });
  }
}

/** Unsubscribe. Feed items you saved to the Library stay; unread feed items go. */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await prisma.document.deleteMany({ where: { feedId: id, isFeed: true } });
    await prisma.feed.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feed DELETE error:', error);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}
