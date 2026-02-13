import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getNextReviewDate } from '@/lib/spaced-repetition';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, text, url } = body;

    if (!title?.trim() || !text?.trim()) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    // Get or create the "Manual" source
    let source = await prisma.source.findFirst({ where: { type: 'manual' } });
    if (!source) {
      source = await prisma.source.create({
        data: { name: 'Manual', type: 'manual', isActive: true },
      });
    }

    // Use a timestamp-based externalId to guarantee uniqueness
    const externalId = `manual_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const highlight = await prisma.highlight.create({
      data: {
        sourceId: source.id,
        externalId,
        text: text.trim(),
        title: title.trim(),
        url: url?.trim() || undefined,
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

    return NextResponse.json(highlight, { status: 201 });
  } catch (error) {
    console.error('Error creating highlight:', error);
    return NextResponse.json({ error: 'Failed to create highlight' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const highlights = await prisma.highlight.findMany({
      include: {
        source: true,
      },
      orderBy: {
        highlightedAt: 'desc',
      },
    });

    return NextResponse.json(highlights);
  } catch (error) {
    console.error('Error fetching highlights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch highlights' },
      { status: 500 }
    );
  }
}
