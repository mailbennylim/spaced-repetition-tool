import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const EDITABLE = [
  'notificationTime', 'notificationsEnabled', 'dailyHighlightsCount', 'timezone', 'homeRows',
  'autoAdvance', 'autoHighlight', 'defaultColor', 'readerFont', 'readerFontSize', 'readerLineHeight',
  'readerLineWidth', 'ttsVoice', 'ttsRate',
] as const;

async function getOrCreate() {
  return (await prisma.settings.findFirst()) ?? prisma.settings.create({ data: {} });
}

export async function GET() {
  try {
    return NextResponse.json(await getOrCreate());
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

async function update(request: NextRequest) {
  const body = await request.json();
  const data: Record<string, unknown> = {};
  for (const key of EDITABLE) {
    if (body[key] !== undefined) data[key] = key === 'homeRows' && typeof body[key] !== 'string' ? JSON.stringify(body[key]) : body[key];
  }
  const current = await getOrCreate();
  return prisma.settings.update({ where: { id: current.id }, data });
}

export async function PUT(request: NextRequest) {
  try { return NextResponse.json(await update(request)); }
  catch (error) { console.error('Settings PUT error:', error); return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 }); }
}

export async function PATCH(request: NextRequest) {
  try { return NextResponse.json(await update(request)); }
  catch (error) { console.error('Settings PATCH error:', error); return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 }); }
}
