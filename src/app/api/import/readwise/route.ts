import { NextResponse } from 'next/server';
import { getImportStatus, runReadwiseImport } from '@/lib/readwise-import';

export async function GET() {
  return NextResponse.json({ ...getImportStatus(), configured: !!process.env.READWISE_ACCESS_TOKEN });
}

/** Starts the import in the background; poll GET for progress. */
export async function POST() {
  const token = process.env.READWISE_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: 'Add READWISE_ACCESS_TOKEN to .env first' }, { status: 400 });
  if (getImportStatus().running) return NextResponse.json(getImportStatus());
  void runReadwiseImport(token);
  await new Promise(r => setTimeout(r, 300));
  return NextResponse.json(getImportStatus());
}
