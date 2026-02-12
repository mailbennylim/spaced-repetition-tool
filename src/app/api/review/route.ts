import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateNextReview, getNextReviewDate } from '@/lib/spaced-repetition';

// Helper: shuffle an array randomly
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Helper: randomly pick N items from an array
function pickRandom<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

export async function GET(request: NextRequest) {
  try {
    const now = new Date();

    // ── SLOT A: 8 recall highlights ──────────────────────────────────────────

    // Candidates: overdue OR never seen (repetitions = 0)
    const slotACandidates = await prisma.reviewSchedule.findMany({
      where: {
        isCompleted: false,
        OR: [
          { scheduledFor: { lte: now } },
          { repetitions: 0 },
        ],
      },
      include: { highlight: { include: { source: true } } },
    });

    // Sort: most overdue first, ties broken by fewest repetitions
    const sortedA = slotACandidates.sort((a, b) => {
      const overdueA = now.getTime() - a.scheduledFor.getTime();
      const overdueB = now.getTime() - b.scheduledFor.getTime();
      if (overdueB !== overdueA) return overdueB - overdueA;
      return a.repetitions - b.repetitions;
    });

    // Cap pool at top 30, then randomly pick 8
    const poolA = sortedA.slice(0, 30);
    const slotA = pickRandom(poolA, 8);
    const slotAIds = new Set(slotA.map(r => r.id));
    const slotAHighlightIds = new Set(slotA.map(r => r.highlightId));

    // ── SLOT B: 2 recent reinforcement highlights ─────────────────────────────

    // Get the 10 most recently imported highlights
    const recentHighlights = await prisma.highlight.findMany({
      orderBy: { importedAt: 'desc' },
      take: 10,
      include: { source: true },
    });

    // Get their review schedules, excluding anything already in Slot A
    const recentHighlightIds = recentHighlights
      .map(h => h.id)
      .filter(id => !slotAHighlightIds.has(id));

    const slotBCandidates = await prisma.reviewSchedule.findMany({
      where: {
        highlightId: { in: recentHighlightIds.length > 0 ? recentHighlightIds : [''] },
        isCompleted: false,
      },
      include: { highlight: { include: { source: true } } },
    });

    const slotB = pickRandom(slotBCandidates, 2);
    const slotBIds = new Set(slotB.map(r => r.id));

    // ── FILL GAPS ─────────────────────────────────────────────────────────────

    const totalPicked = slotA.length + slotB.length;
    const allPickedIds = new Set([...slotAIds, ...slotBIds]);
    let filler: typeof slotA = [];

    if (totalPicked < 10) {
      filler = await prisma.reviewSchedule.findMany({
        where: {
          id: { notIn: [...allPickedIds] },
          isCompleted: false,
        },
        include: { highlight: { include: { source: true } } },
        orderBy: [
          { repetitions: 'asc' },
          { scheduledFor: 'asc' },
        ],
        take: 10 - totalPicked,
      });
    }

    // ── COMBINE AND SHUFFLE ───────────────────────────────────────────────────

    const final = shuffle([...slotA, ...slotB, ...filler]);
    return NextResponse.json(final);

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, quality } = body;

    if (typeof quality !== 'number' || quality < 0 || quality > 5) {
      return NextResponse.json(
        { error: 'Quality must be a number between 0 and 5' },
        { status: 400 }
      );
    }

    const review = await prisma.reviewSchedule.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    const result = calculateNextReview(
      quality,
      review.interval,
      review.repetitions,
      review.easeFactor
    );

    const nextReviewDate = getNextReviewDate(result.interval);

    const updatedReview = await prisma.reviewSchedule.update({
      where: { id: reviewId },
      data: {
        interval: result.interval,
        repetitions: result.repetitions,
        easeFactor: result.easeFactor,
        scheduledFor: nextReviewDate,
        lastReviewed: new Date(),
        quality: quality,
        isCompleted: quality >= 3, // Mark as completed if quality is good
      },
    });

    return NextResponse.json(updatedReview);
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}
