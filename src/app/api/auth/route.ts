import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, authEnabled, isCorrectPassword, sessionToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  if (!authEnabled()) return NextResponse.json({ ok: true });
  const { password } = await request.json().catch(() => ({ password: '' }));
  if (!isCorrectPassword(String(password ?? ''))) {
    await new Promise(r => setTimeout(r, 800)); // slow down guessing
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionToken(), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 365 });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
