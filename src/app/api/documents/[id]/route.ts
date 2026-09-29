import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { summaryInclude, toSummary, setDocumentTags } from '@/lib/documents';

type Ctx = { params: Promise<{ id: string }> };

/** Full document, including content and highlights (for the reading view). */
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const doc = await prisma.document.findUnique({
      where: { id },
      include: { ...summaryInclude, highlights: { orderBy: { createdAt: 'asc' } } },
    });
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({
      ...toSummary(doc),
      content: doc.content,
      filePath: doc.filePath,
      position: doc.position,
      highlights: doc.highlights,
    });
  } catch (error) {
    console.error('Document GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}

/**
 * Partial update. Accepts any of:
 *  location ('inbox'|'archive'), seen, tags (string[]), note, title, author,
 *  progress (0–1), position (any JSON), opened (true → lastOpenedAt = now),
 *  saveToLibrary (true → feed item becomes a library document),
 *  trash (true|false), resetProgress (true)
 */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.location === 'inbox' || body.location === 'archive') { data.location = body.location; data.movedAt = new Date(); }
    if (typeof body.seen === 'boolean') data.seen = body.seen;
    if (typeof body.note === 'string') data.note = body.note.trim() || null;
    if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim();
    if (typeof body.author === 'string') data.author = body.author.trim() || null;
    if (body.opened) { data.lastOpenedAt = new Date(); data.seen = true; }
    if (body.position !== undefined) data.position = typeof body.position === 'string' ? body.position : JSON.stringify(body.position);
    if (body.saveToLibrary) { data.isFeed = false; data.location = 'inbox'; data.movedAt = new Date(); data.savedUsing = 'feed'; }
    if (typeof body.isFeed === 'boolean') data.isFeed = body.isFeed; // undo of "save to library"
    if (body.trash === true) data.deletedAt = new Date();
    if (body.trash === false) data.deletedAt = null;
    if (body.resetProgress) { data.progress = 0; data.position = null; }

    if (typeof body.progress === 'number') {
      // Progress never goes backwards (docs/ux-spec.md §4.4)
      const current = await prisma.document.findUnique({ where: { id }, select: { progress: true } });
      if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      data.progress = Math.max(current.progress, Math.min(1, body.progress));
    }

    if (Array.isArray(body.tags)) await setDocumentTags(id, body.tags);

    const doc = await prisma.document.update({ where: { id }, data, include: summaryInclude });
    return NextResponse.json(toSummary(doc));
  } catch (error) {
    console.error('Document PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}

/** Permanent delete (used when emptying Trash). Normal delete is PATCH { trash: true }. */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (doc.filePath) await unlink(path.join(process.cwd(), 'public', doc.filePath)).catch(() => {});
    await prisma.document.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Document DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
