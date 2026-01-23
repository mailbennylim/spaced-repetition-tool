import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateQuestionsFromHighlight } from '@/lib/question-generator';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const highlightId = searchParams.get('highlightId');
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    if (highlightId) {
      // Get questions for a specific highlight
      const questions = await prisma.testQuestion.findMany({
        where: { highlightId },
        include: {
          highlight: {
            include: {
              source: true,
            },
          },
        },
      });

      return NextResponse.json(questions);
    }

    // Get random highlights for testing
    const highlights = await prisma.highlight.findMany({
      include: {
        source: true,
        testQuestions: true,
      },
      take: limit * 2, // Get more to filter
    });

    // Filter highlights that have questions or can generate them
    const highlightsWithQuestions = highlights
      .filter(h => h.testQuestions.length > 0 || h.text.length > 50)
      .slice(0, limit);

    return NextResponse.json(highlightsWithQuestions);
  } catch (error) {
    console.error('Error fetching test questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test questions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { highlightId } = body;

    if (!highlightId) {
      return NextResponse.json(
        { error: 'Highlight ID is required' },
        { status: 400 }
      );
    }

    const highlight = await prisma.highlight.findUnique({
      where: { id: highlightId },
    });

    if (!highlight) {
      return NextResponse.json(
        { error: 'Highlight not found' },
        { status: 404 }
      );
    }

    // Check if questions already exist
    const existingQuestions = await prisma.testQuestion.findMany({
      where: { highlightId },
    });

    if (existingQuestions.length > 0) {
      return NextResponse.json(existingQuestions);
    }

    // Generate new questions
    const generatedQuestions = await generateQuestionsFromHighlight(
      highlight.text,
      highlight.note || undefined,
      highlight.title || undefined
    );

    // Save questions to database
    const savedQuestions = await Promise.all(
      generatedQuestions.map(q =>
        prisma.testQuestion.create({
          data: {
            highlightId,
            question: q.question,
            answer: q.answer,
            difficulty: q.difficulty,
          },
        })
      )
    );

    return NextResponse.json(savedQuestions);
  } catch (error) {
    console.error('Error generating test questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate test questions' },
      { status: 500 }
    );
  }
}
