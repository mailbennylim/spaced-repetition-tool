import { NextRequest, NextResponse } from 'next/server';
import { searchFeeds } from '@/lib/rss';
import { prisma } from '@/lib/prisma';

/** Feed search (docs/ux-spec.md §3.3.1): ?q=name or site URL → candidates, marked if already subscribed. */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? '';
  if (!q.trim()) return NextResponse.json([]);
  try {
    const [candidates, subs] = await Promise.all([searchFeeds(q), prisma.feed.findMany({ select: { url: true } })]);
    const subscribed = new Set(subs.map(s => s.url.replace(/\/$/, '')));
    return NextResponse.json(candidates.map(c => ({ ...c, subscribed: subscribed.has(c.url.replace(/\/$/, '')) })));
  } catch (error) {
    console.error('Feed search error:', error);
    return NextResponse.json([]);
  }
}
