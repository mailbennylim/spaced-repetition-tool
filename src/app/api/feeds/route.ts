import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { subscribe } from '@/lib/rss';

export async function GET() {
  try {
    const feeds = await prisma.feed.findMany({
      include: { folder: true, _count: { select: { documents: true } } },
      orderBy: { title: 'asc' },
    });
    const unseen = await prisma.document.groupBy({ by: ['feedId'], where: { isFeed: true, seen: false, deletedAt: null }, _count: { _all: true } });
    const unseenMap = new Map(unseen.map(u => [u.feedId, u._count._all]));
    return NextResponse.json(feeds.map(f => ({ id: f.id, kind: f.kind, title: f.title, url: f.url, siteUrl: f.siteUrl, iconUrl: f.iconUrl, description: f.description, folder: f.folder?.name ?? null, folderId: f.folderId, count: f._count.documents, unseen: unseenMap.get(f.id) ?? 0, lastFetchedAt: f.lastFetchedAt, lastItemAt: f.lastItemAt, lastError: f.lastError })));
  } catch (error) {
    console.error('Feeds GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch feeds' }, { status: 500 });
  }
}

/** Subscribe: { url, title?, siteUrl?, iconUrl?, description? } */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.url) return NextResponse.json({ error: 'Feed URL required' }, { status: 400 });
    const feed = await subscribe(String(body.url), body);
    return NextResponse.json(feed, { status: 201 });
  } catch (error) {
    console.error('Feed subscribe error:', error);
    return NextResponse.json({ error: "Couldn't read that feed" }, { status: 400 });
  }
}
