import { NextRequest, NextResponse } from 'next/server';

/**
 * Sign-in gate (runs on every request). Only active when APP_PASSWORD is set.
 * Public: the login page, the auth API, the inbound email webhook, the manifest/icons and static assets.
 */
const PUBLIC = [/^\/login$/, /^\/api\/auth$/, /^\/api\/inbound\//, /^\/manifest\.webmanifest$/, /^\/icon-\d+\.png$/, /^\/pdf\.worker/, /^\/finish\//, /^\/_next\//, /^\/favicon/];

export function proxy(request: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();
  const { pathname } = request.nextUrl;
  if (PUBLIC.some(re => re.test(pathname))) return NextResponse.next();
  const token = request.cookies.get('reader_session')?.value;
  if (token && token === expectedToken(password)) return NextResponse.next();
  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

// Edge-safe HMAC is async, so the token is precomputed once per process from the same recipe as lib/auth.ts.
let cached: { password: string; token: string } | null = null;
function expectedToken(password: string): string {
  if (cached?.password === password) return cached.token;
  // Node runtime: synchronous crypto is available.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createHmac } = require('crypto') as typeof import('crypto');
  const token = createHmac('sha256', password).update('reader-session-v1').digest('hex');
  cached = { password, token };
  return token;
}

export const config = { matcher: ['/((?!_next/static|_next/image).*)'] };
