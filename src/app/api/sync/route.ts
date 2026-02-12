import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RaindropClient } from '@/lib/raindrop';
import { ReadwiseClient } from '@/lib/readwise';
import { getNextReviewDate } from '@/lib/spaced-repetition';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source } = body; // 'raindrop', 'readwise', or 'all'

    const results = {
      raindrop: { success: false, count: 0, error: null as string | null },
      readwise: { success: false, count: 0, error: null as string | null },
    };

    // Sync Raindrop
    if (source === 'raindrop' || source === 'all') {
      const raindropToken = process.env.RAINDROP_ACCESS_TOKEN;

      if (raindropToken) {
        try {
          const client = new RaindropClient(raindropToken);
          const highlights = await client.fetchHighlights(100);

          // Get or create Raindrop source
          let raindropSource = await prisma.source.findFirst({
            where: { type: 'raindrop' },
          });

          if (!raindropSource) {
            raindropSource = await prisma.source.create({
              data: {
                name: 'Raindrop',
                type: 'raindrop',
                isActive: true,
              },
            });
          }

          let importCount = 0;

          for (const highlight of highlights) {
            const existingHighlight = await prisma.highlight.findUnique({
              where: {
                sourceId_externalId: {
                  sourceId: raindropSource.id,
                  externalId: highlight._id.toString(),
                },
              },
            });

            if (!existingHighlight) {
              const newHighlight = await prisma.highlight.create({
                data: {
                  sourceId: raindropSource.id,
                  externalId: highlight._id.toString(),
                  text: highlight.text,
                  note: highlight.note || undefined,
                  title: highlight.raindropTitle || undefined,
                  url: highlight.raindropLink || undefined,
                  tags: highlight.tags && highlight.tags.length > 0 ? highlight.tags.join(', ') : undefined,
                  highlightedAt: new Date(highlight.created),
                },
              });

              // Create initial review schedule
              await prisma.reviewSchedule.create({
                data: {
                  highlightId: newHighlight.id,
                  scheduledFor: getNextReviewDate(1),
                  interval: 1,
                  easeFactor: 2.5,
                  repetitions: 0,
                },
              });

              importCount++;
            }
          }

          await prisma.source.update({
            where: { id: raindropSource.id },
            data: { lastSyncAt: new Date() },
          });

          results.raindrop = { success: true, count: importCount, error: null };
        } catch (error) {
          results.raindrop.error = error instanceof Error ? error.message : 'Unknown error';
        }
      } else {
        results.raindrop.error = 'Raindrop access token not configured';
      }
    }

    // Sync Readwise
    if (source === 'readwise' || source === 'all') {
      const readwiseToken = process.env.READWISE_ACCESS_TOKEN;

      if (readwiseToken) {
        try {
          const client = new ReadwiseClient(readwiseToken);
          const highlights = await client.fetchHighlights(100);
          const books = await client.fetchBooks();

          // Create a map of book IDs to book details
          const bookMap = new Map(books.map(book => [book.id, book]));

          // Get or create Readwise source
          let readwiseSource = await prisma.source.findFirst({
            where: { type: 'readwise' },
          });

          if (!readwiseSource) {
            readwiseSource = await prisma.source.create({
              data: {
                name: 'Readwise Reader',
                type: 'readwise',
                isActive: true,
              },
            });
          }

          let importCount = 0;

          for (const highlight of highlights) {
            const existingHighlight = await prisma.highlight.findUnique({
              where: {
                sourceId_externalId: {
                  sourceId: readwiseSource.id,
                  externalId: highlight.id,
                },
              },
            });

            if (!existingHighlight) {
              const book = highlight.book_id ? bookMap.get(highlight.book_id) : null;

              const newHighlight = await prisma.highlight.create({
                data: {
                  sourceId: readwiseSource.id,
                  externalId: highlight.id,
                  text: highlight.text,
                  note: highlight.note || highlight.document_note || undefined,
                  title: book?.title,
                  author: book?.author,
                  url: highlight.url || book?.source_url || undefined,
                  tags: highlight.tags?.map(t => t.name).join(', '),
                  highlightedAt: highlight.highlighted_at
                    ? new Date(highlight.highlighted_at)
                    : new Date(highlight.updated),
                },
              });

              // Create initial review schedule
              await prisma.reviewSchedule.create({
                data: {
                  highlightId: newHighlight.id,
                  scheduledFor: getNextReviewDate(1),
                  interval: 1,
                  easeFactor: 2.5,
                  repetitions: 0,
                },
              });

              importCount++;
            }
          }

          await prisma.source.update({
            where: { id: readwiseSource.id },
            data: { lastSyncAt: new Date() },
          });

          results.readwise = { success: true, count: importCount, error: null };
        } catch (error) {
          results.readwise.error = error instanceof Error ? error.message : 'Unknown error';
        }
      } else {
        results.readwise.error = 'Readwise access token not configured';
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync highlights' },
      { status: 500 }
    );
  }
}
