import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractArticle } from '@/lib/article-extract';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const items = await prisma.readingItem.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { readingHighlights: true } } },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Library GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch library' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // ── File upload (epub / pdf) ───────────────────────────────────────────
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const title = (formData.get('title') as string | null)?.trim();

      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['epub', 'pdf'].includes(ext ?? ''))
        return NextResponse.json({ error: 'Only EPUB and PDF files are supported' }, { status: 400 });

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadsDir, { recursive: true });

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename = `${Date.now()}-${safeName}`;
      const filepath = path.join(uploadsDir, filename);
      await writeFile(filepath, Buffer.from(await file.arrayBuffer()));

      const item = await prisma.readingItem.create({
        data: {
          title: title || file.name.replace(/\.[^.]+$/, '').replace(/_/g, ' '),
          type: ext as string,
          filePath: `/uploads/${filename}`,
        },
        include: { _count: { select: { readingHighlights: true } } },
      });
      return NextResponse.json(item, { status: 201 });
    }

    // ── Article from URL ──────────────────────────────────────────────────
    const { url } = await request.json();
    if (!url?.trim()) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    // Check for duplicate
    const existing = await prisma.readingItem.findFirst({ where: { url } });
    if (existing) return NextResponse.json({ error: 'This article is already in your library', existing }, { status: 409 });

    const article = await extractArticle(url);
    const item = await prisma.readingItem.create({
      data: {
        title: article.title,
        author: article.byline,
        type: 'article',
        url,
        content: article.content,
        ogImage: article.ogImage,
      },
      include: { _count: { select: { readingHighlights: true } } },
    });
    return NextResponse.json(item, { status: 201 });

  } catch (error) {
    console.error('Library POST error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to add item';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
