// One-time migration: ReadingItem → Document, ReadingHighlight → Highlight.
// Safe to run more than once. Run with: node scripts/migrate-to-documents.mjs
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function domainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
}
function plainText(html) {
  return (html || '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

async function main() {
  const items = await prisma.readingItem.findMany({ include: { readingHighlights: true } });
  let docs = 0, linked = 0, created = 0;

  let manual = await prisma.source.findFirst({ where: { type: 'manual' } });
  if (!manual) manual = await prisma.source.create({ data: { name: 'Manual', type: 'manual' } });

  for (const item of items) {
    const exists = await prisma.document.findUnique({ where: { id: item.id } });
    if (!exists) {
      const text = plainText(item.content);
      await prisma.document.create({
        data: {
          id: item.id,
          title: item.title,
          author: item.author,
          type: item.type,
          url: item.url,
          domain: item.url ? domainOf(item.url) : null,
          excerpt: text ? text.slice(0, 280) : null,
          content: item.content,
          filePath: item.filePath,
          coverImage: item.coverImage,
          imageUrl: item.ogImage,
          wordCount: text ? text.split(' ').length : null,
          position: item.readingProgress,
          location: 'inbox',
          seen: !!item.readingProgress,
          savedUsing: 'app',
          savedAt: item.createdAt,
          movedAt: item.createdAt,
        },
      });
      docs++;
    }

    for (const rh of item.readingHighlights) {
      const existing = await prisma.highlight.findFirst({
        where: { OR: [{ externalId: `reading_${rh.id}` }, { externalId: rh.id, sourceId: manual.id }] },
      });
      const data = {
        documentId: item.id,
        kind: rh.type === 'image' ? 'image' : 'text',
        imageUrl: rh.imageUrl,
        position: rh.position,
        color: rh.color || 'yellow',
      };
      if (existing) {
        await prisma.highlight.update({ where: { id: existing.id }, data });
        linked++;
      } else {
        const h = await prisma.highlight.create({
          data: {
            ...data,
            sourceId: manual.id,
            externalId: rh.id,
            text: rh.text || '',
            note: rh.note,
            title: item.title,
            author: item.author,
            url: item.url,
            highlightedAt: rh.createdAt,
          },
        });
        if (h.kind === 'text' && h.text.trim()) {
          await prisma.reviewSchedule.create({
            data: { highlightId: h.id, scheduledFor: new Date(), interval: 30 },
          });
        }
        created++;
      }
    }
  }

  // Highlights that point at a document by title only (e.g. added before documents existed) stay as they are.
  console.log(JSON.stringify({ readingItems: items.length, documentsCreated: docs, highlightsLinked: linked, highlightsCreated: created }));
}

main().finally(() => prisma.$disconnect());
