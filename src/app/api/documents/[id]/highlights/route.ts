import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isHighlightColor } from '@/lib/colors';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const highlights = await prisma.highlight.findMany({ where: { documentId: id }, orderBy: { createdAt: 'asc' } });
    return NextResponse.json(highlights);
  } catch (error) {
    console.error('Highlights GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch highlights' }, { status: 500 });
  }
}

/**
 * Create a highlight on a document. Body: { kind?: 'text'|'image', text, imageUrl?, color?, position, note? }.
 * Every text highlight joins the review pool straight away (docs/ux-spec.md §3.6).
 */
export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await request.json();
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    let source = await prisma.source.findFirst({ where: { type: 'manual' } });
    if (!source) source = await prisma.source.create({ data: { name: 'Manual', type: 'manual' } });

    const settings = await prisma.settings.findFirst();
    const color = isHighlightColor(body.color) ? body.color : (settings?.defaultColor ?? 'yellow');
    const text = String(body.text ?? '').trim();
    const kind = body.kind === 'image' ? 'image' : 'text';
    if (kind === 'text' && !text) return NextResponse.json({ error: 'Empty highlight' }, { status: 400 });

    const highlight = await prisma.highlight.create({
      data: {
        sourceId: source.id,
        externalId: `app_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        documentId: id,
        kind,
        text,
        imageUrl: body.imageUrl ?? null,
        note: body.note?.trim() || null,
        color,
        position: body.position ? JSON.stringify(body.position) : null,
        title: doc.title,
        author: doc.author,
        url: doc.url,
        highlightedAt: new Date(),
      },
    });

    if (kind === 'text') {
      // New highlights are due immediately (repetitions = 0 makes them eligible for Slot A).
      await prisma.reviewSchedule.create({ data: { highlightId: highlight.id, scheduledFor: new Date(), interval: 30 } });
    }

    return NextResponse.json(highlight, { status: 201 });
  } catch (error) {
    console.error('Highlight POST error:', error);
    return NextResponse.json({ error: 'Failed to save highlight' }, { status: 500 });
  }
}
