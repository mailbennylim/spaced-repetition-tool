import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { progress } = await request.json();
    const item = await prisma.readingItem.update({
      where: { id },
      data: { readingProgress: JSON.stringify(progress) },
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error('Progress save error:', error);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}
