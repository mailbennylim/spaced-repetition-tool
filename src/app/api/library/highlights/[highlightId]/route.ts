import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ highlightId: string }> }) {
  try {
    const { highlightId } = await params;
    await prisma.readingHighlight.delete({ where: { id: highlightId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Highlight DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete highlight' }, { status: 500 });
  }
}
