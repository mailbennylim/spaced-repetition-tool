import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateNextReview, getNextReviewDate } from '@/lib/spaced-repetition';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    const now = new Date();

    // Get highlights scheduled for review today or earlier
    const dueReviews = await prisma.reviewSchedule.findMany({
      where: {
        scheduledFor: {
          lte: now,
        },
        isCompleted: false,
      },
      include: {
        highlight: {
          include: {
            source: true,
          },
        },
      },
      orderBy: {
        scheduledFor: 'asc',
      },
      take: limit,
    });

    return NextResponse.json(dueReviews);
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
