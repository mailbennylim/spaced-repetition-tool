import { NextResponse } from 'next/server';
import { continueDocument } from '@/lib/documents';

export async function GET() {
  try {
    return NextResponse.json(await continueDocument());
  } catch (error) {
    console.error('Continue GET error:', error);
    return NextResponse.json(null);
  }
}
