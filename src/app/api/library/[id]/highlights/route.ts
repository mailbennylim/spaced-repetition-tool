import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getNextReviewDate } from '@/lib/spaced-repetition';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const highlights = await prisma.readingHighlight.findMany({
      where: { readingItemId: id },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(highlights);
  } catch (error) {
    console.error('Highlights GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch highlights' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { text, imageUrl, type, position, note } = body;

    // Fetch the reading item for source metadata
    const readingItem = await prisma.readingItem.findUnique({ where: { id } });
    if (!readingItem) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    // Save the reading highlight (for in-reader display)
    const readingHighlight = await prisma.readingHighlight.create({
      data: { readingItemId: id, text, imageUrl, type, position: JSON.stringify(position), note },
    });

    // Also add to spaced repetition queue via existing Highlight system
    if (text?.trim()) {
      let source = await prisma.source.findFirst({ where: { type: 'manual' } });
      if (!source) {
        source = await prisma.source.create({
          data: { name: 'Manual', type: 'manual', isActive: true },
        });
      }

      const highlight = await prisma.highlight.create({
        data: {
          sourceId: source.id,
          externalId: `reading_${readingHighlight.id}`,
          text: text.trim(),
          note: note || undefined,
          title: readingItem.title,
          author: readingItem.author || undefined,
          url: readingItem.url || undefined,
          highlightedAt: new Date(),
        },
      });

      await prisma.reviewSchedule.create({
        data: {
          highlightId: highlight.id,
          scheduledFor: getNextReviewDate(1),
          interval: 1,
          easeFactor: 2.5,
          repetitions: 0,
        },
      });
    }

    return NextResponse.json(readingHighlight, { status: 201 });
  } catch (error) {
    console.error('Highlight POST error:', error);
    return NextResponse.json({ error: 'Failed to save highlight' }, { status: 500 });
  }
}
