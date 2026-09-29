import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { plainText, domainOf } from '@/lib/format';

/**
 * Inbound email (docs/ux-spec.md §3.9). A Cloudflare Email Worker (see deploy/email-worker.js) POSTs:
 *   { to, from, fromName?, subject, html?, text?, date? }  with header  Authorization: Bearer <INBOUND_EMAIL_SECRET>
 * Addresses: <libraryToken>@library.<domain> → Inbox (type 'email');  <feedToken>@feed.<domain> → Feed, one "newsletter" feed per sender.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.INBOUND_EMAIL_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const to = String(body.to ?? '').toLowerCase();
    const settings = await prisma.settings.findFirst();
    const local = to.split('@')[0]?.replace(/\+.*$/, '');
    const isLibrary = !!settings?.libraryEmailToken && local === settings.libraryEmailToken.toLowerCase();
    const isFeed = !!settings?.feedEmailToken && local === settings.feedEmailToken.toLowerCase();
    if (!isLibrary && !isFeed) return NextResponse.json({ error: 'Unknown address' }, { status: 404 });

    const html: string = body.html || (body.text ? `<pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(String(body.text))}</pre>` : '');
    const text = plainText(html);
    const from = String(body.from ?? '');
    const fromName = String(body.fromName || from.split('@')[0] || 'Email');
    const subject = String(body.subject || '(no subject)');
    const date = body.date ? new Date(body.date) : new Date();

    let feedId: string | null = null;
    if (isFeed) {
      const feed = await prisma.feed.upsert({
        where: { url: `mailto:${from.toLowerCase()}` },
        update: { title: fromName },
        create: { kind: 'newsletter', url: `mailto:${from.toLowerCase()}`, title: fromName, iconUrl: domainOf(`https://${from.split('@')[1]}`) ? `https://icons.duckduckgo.com/ip3/${from.split('@')[1]}.ico` : null },
      });
      feedId = feed.id;
    }

    const doc = await prisma.document.create({
      data: {
        title: subject,
        author: fromName,
        type: 'email',
        domain: from.split('@')[1] || null,
        siteName: fromName,
        excerpt: text.slice(0, 280) || null,
        content: html,
        wordCount: text ? text.split(' ').length : null,
        publishedAt: date,
        isFeed: isFeed,
        location: 'inbox',
        feedId,
        savedUsing: 'email',
        savedAt: date,
        movedAt: date,
        imageUrl: html.match(/<img[^>]+src=["'](https?:[^"']+)/i)?.[1] ?? null,
      },
    });
    return NextResponse.json({ id: doc.id, placed: isFeed ? 'feed' : 'inbox' }, { status: 201 });
  } catch (error) {
    console.error('Inbound email error:', error);
    return NextResponse.json({ error: 'Failed to store email' }, { status: 500 });
  }
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
