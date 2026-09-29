import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isHighlightColor } from '@/lib/colors';

type Ctx = { params: Promise<{ id: string }> };

/** Update colour, note, text or position. */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (isHighlightColor(body.color)) data.color = body.color;
    if (typeof body.note === 'string') data.note = body.note.trim() || null;
    if (typeof body.text === 'string' && body.text.trim()) data.text = body.text.trim();
    if (body.position !== undefined) data.position = JSON.stringify(body.position);
    const highlight = await prisma.highlight.update({ where: { id }, data });
    return NextResponse.json(highlight);
  } catch (error) {
    console.error('Highlight PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update highlight' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await prisma.highlight.delete({ where: { id } }); // cascades to review schedules
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Highlight DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete highlight' }, { status: 500 });
  }
}
