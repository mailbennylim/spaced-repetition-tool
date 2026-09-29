import { NextRequest, NextResponse } from 'next/server';
import { listDocuments, parseListQuery } from '@/lib/documents';
import { saveUrl, saveUpload } from '@/lib/save-document';

export async function GET(request: NextRequest) {
  try {
    const q = parseListQuery(request.nextUrl.searchParams);
    return NextResponse.json(await listDocuments(q));
  } catch (error) {
    console.error('Documents GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      const doc = await saveUpload(file, (formData.get('savedUsing') as string) || 'app');
      return NextResponse.json(doc, { status: 201 });
    }

    const body = await request.json();
    if (!body.url?.trim()) return NextResponse.json({ error: 'URL required' }, { status: 400 });
    const { doc, existed } = await saveUrl({
      url: body.url,
      savedUsing: body.savedUsing || 'app',
      location: body.location,
      tags: body.tags,
      note: body.note,
    });
    return NextResponse.json({ ...doc, existed }, { status: existed ? 200 : 201 });
  } catch (error) {
    console.error('Documents POST error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to save';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
