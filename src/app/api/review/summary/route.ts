import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay } from 'date-fns';

/** Numbers for the Daily Review hero and the tab badge. */
export async function GET() {
  try {
    const now = new Date();
    const today = startOfDay(now);
    const settings = await prisma.settings.findFirst();
    const perDay = settings?.dailyHighlightsCount ?? 10;

    const [total, reviewedToday, dueRows] = await Promise.all([
      prisma.reviewSchedule.count({ where: { isCompleted: false } }),
      prisma.reviewSchedule.count({ where: { lastReviewed: { gte: today } } }),
      prisma.reviewSchedule.findMany({
        where: { isCompleted: false, OR: [{ scheduledFor: { lte: now } }, { repetitions: 0 }] },
        include: { highlight: { select: { title: true, author: true } } },
        take: 200,
      }),
    ]);

    const due = Math.max(0, Math.min(perDay, dueRows.length) - reviewedToday);
    const sources = [...new Set(dueRows.map(r => r.highlight.author || r.highlight.title).filter(Boolean) as string[])].slice(0, 3);

    return NextResponse.json({ due, total, sources, doneToday: reviewedToday >= perDay && perDay > 0, reviewedToday });
  } catch (error) {
    console.error('Review summary error:', error);
    return NextResponse.json({ due: 0, total: 0, sources: [], doneToday: false, reviewedToday: 0 });
  }
}
