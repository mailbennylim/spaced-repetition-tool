import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Export every highlight as Markdown (grouped by document) or CSV. */
export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get('format') === 'csv' ? 'csv' : 'md';
  const rows = await prisma.highlight.findMany({ include: { document: { select: { title: true, author: true, url: true } } }, orderBy: [{ title: 'asc' }, { createdAt: 'asc' }] });
  const date = new Date().toISOString().slice(0, 10);

  if (format === 'csv') {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = ['title,author,url,text,note,color,tags,highlighted_at', ...rows.map(h => [h.document?.title ?? h.title, h.document?.author ?? h.author, h.document?.url ?? h.url, h.text, h.note, h.color, h.tags, h.highlightedAt.toISOString()].map(esc).join(','))];
    return new NextResponse(lines.join('\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="highlights-${date}.csv"` } });
  }

  const groups = new Map<string, typeof rows>();
  for (const h of rows) { const k = h.document?.title ?? h.title ?? 'Untitled'; (groups.get(k) ?? groups.set(k, []).get(k)!).push(h); }
  const md = [...groups.entries()].map(([title, hs]) => {
    const first = hs[0];
    const head = [`## ${title}`, first.document?.author ?? first.author ? `*${first.document?.author ?? first.author}*` : '', first.document?.url ?? first.url ? `<${first.document?.url ?? first.url}>` : ''].filter(Boolean).join('\n');
    return `${head}\n\n${hs.map(h => `- ${h.kind === 'image' ? `![](${h.imageUrl})` : h.text}${h.note ? `\n  - *${h.note}*` : ''}`).join('\n')}\n`;
  }).join('\n');
  return new NextResponse(`# Highlights\n\n${md}`, { headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Content-Disposition': `attachment; filename="highlights-${date}.md"` } });
}
