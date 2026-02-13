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

// Helper: spread items so no two adjacent items share the same article title.
// Uses a greedy interleave: always place the item whose title differs from the last placed.
type WithTitle = { highlight: { title?: string | null } };
function spreadByTitle<T extends WithTitle>(arr: T[]): T[] {
  if (arr.length <= 1) return arr;
  // Group by title (null/undefined treated as unique per-item)
  const groups = new Map<string, T[]>();
  arr.forEach((item, i) => {
    const key = item.highlight.title?.trim() || `__unique_${i}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  });

  const result: T[] = [];
  // Repeatedly pick from the largest group that doesn't match last placed title
  const buckets = [...groups.entries()].map(([key, items]) => ({ key, items }));

  while (result.length < arr.length) {
    const lastKey = result.length > 0
      ? (result[result.length - 1].highlight.title?.trim() || `__unique_${arr.indexOf(result[result.length - 1])}`)
      : null;

    // Find eligible buckets (different title from last, non-empty)
    const eligible = buckets.filter(b => b.items.length > 0 && b.key !== lastKey);

    if (eligible.length === 0) {
      // Fallback: just take from any non-empty bucket
      const any = buckets.find(b => b.items.length > 0);
      if (!any) break;
      result.push(any.items.shift()!);
    } else {
      // Pick from the largest eligible bucket (greedy)
      eligible.sort((a, b) => b.items.length - a.items.length);
      result.push(eligible[0].items.shift()!);
    }
  }
  return result;
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

    // Cap pool at top 30, then limit to max 2 per article title, then randomly pick 8
    const poolA30 = sortedA.slice(0, 30);
    const titleCountA = new Map<string, number>();
    const poolA = poolA30.filter(r => {
      const title = r.highlight.title?.trim() || '';
      const count = titleCountA.get(title) ?? 0;
      if (count >= 2) return false;
      titleCountA.set(title, count + 1);
      return true;
    });
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

    const shuffled = shuffle([...slotA, ...slotB, ...filler]);
    const final = spreadByTitle(shuffled);
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
    const { reviewId, interval: rawInterval } = body;

    // Clamp interval between 1 and 365 days, default 30
    const interval = Math.min(365, Math.max(1, Number(rawInterval) || 30));

    const review = await prisma.reviewSchedule.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const nextReviewDate = getNextReviewDate(interval);

    const updatedReview = await prisma.reviewSchedule.update({
      where: { id: reviewId },
      data: {
        interval,
        repetitions: review.repetitions + 1,
        scheduledFor: nextReviewDate,
        lastReviewed: new Date(),
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
