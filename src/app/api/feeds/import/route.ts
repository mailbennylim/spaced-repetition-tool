import { NextRequest, NextResponse } from 'next/server';
import { subscribe } from '@/lib/rss';

/** OPML import (docs/ux-spec.md §3.9): multipart "file" → subscribes to every outline with an xmlUrl. */
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
    const xml = await file.text();
    const outlines = [...xml.matchAll(/<outline\b[^>]*>/gi)].map(m => m[0]);
    const feeds = outlines.map(o => ({
      url: o.match(/xmlUrl="([^"]+)"/i)?.[1],
      title: o.match(/\btitle="([^"]*)"/i)?.[1] || o.match(/\btext="([^"]*)"/i)?.[1],
      siteUrl: o.match(/htmlUrl="([^"]+)"/i)?.[1],
    })).filter(f => f.url);
    let added = 0, failed = 0;
    for (const f of feeds) {
      try { await subscribe(f.url!, { title: f.title ? decode(f.title) : undefined, siteUrl: f.siteUrl }); added++; } catch { failed++; }
    }
    return NextResponse.json({ found: feeds.length, added, failed });
  } catch (error) {
    console.error('OPML import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}

const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
