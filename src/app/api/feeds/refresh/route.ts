import { NextResponse } from 'next/server';
import { refreshAllFeeds } from '@/lib/rss';

export async function POST() {
  try {
    return NextResponse.json(await refreshAllFeeds());
  } catch (error) {
    console.error('Feeds refresh error:', error);
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
