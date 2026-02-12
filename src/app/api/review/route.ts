import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateNextReview, getNextReviewDate } from '@/lib/spaced-repetition';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    const now = new Date();

    // Fetch all due reviews (more than we need so we can sort smartly)
    const allDue = await prisma.reviewSchedule.findMany({
      where: {
        scheduledFor: { lte: now },
        isCompleted: false,
      },
      include: {
        highlight: { include: { source: true } },
      },
    });

    // Priority order for due items:
    // 1. Never reviewed before (repetitions = 0) - brand new highlights first
    // 2. Most overdue (scheduledFor furthest in the past)
    // 3. Fewest repetitions (seen the least)
    const sortedDue = allDue.sort((a, b) => {
      // Never-seen items first
      if (a.repetitions === 0 && b.repetitions !== 0) return -1;
      if (b.repetitions === 0 && a.repetitions !== 0) return 1;
      // Then most overdue
      const overdueA = now.getTime() - a.scheduledFor.getTime();
      const overdueB = now.getTime() - b.scheduledFor.getTime();
      if (overdueB !== overdueA) return overdueB - overdueA;
      // Then fewest repetitions
      return a.repetitions - b.repetitions;
    });

    const picked = sortedDue.slice(0, limit);

    // Fill remaining slots from upcoming items (not yet due)
    if (picked.length < limit) {
      const existingIds = picked.map(r => r.id);
      const upcoming = await prisma.reviewSchedule.findMany({
        where: {
          id: { notIn: existingIds.length > 0 ? existingIds : [''] },
          isCompleted: false,
        },
        include: {
          highlight: { include: { source: true } },
        },
        // Prioritise unseen upcoming items, then soonest due
        orderBy: [
          { repetitions: 'asc' },
          { scheduledFor: 'asc' },
        ],
        take: limit - picked.length,
      });

      return NextResponse.json([...picked, ...upcoming]);
    }

    return NextResponse.json(picked);
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
