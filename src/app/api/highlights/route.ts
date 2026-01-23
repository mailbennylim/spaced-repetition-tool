import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
