import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Single-user sign-in (docs/build-plan.md Phase 7). Enabled only when APP_PASSWORD is set,
 * so local development needs no login. The cookie holds an HMAC of the password + a version salt.
 */
export const SESSION_COOKIE = 'reader_session';

export function authEnabled() {
  return !!process.env.APP_PASSWORD;
}

export function sessionToken(): string {
  return createHmac('sha256', process.env.APP_PASSWORD!).update('reader-session-v1').digest('hex');
}

export function isValidSession(token: string | undefined): boolean {
  if (!authEnabled()) return true;
  if (!token) return false;
  const expected = sessionToken();
  return token.length === expected.length && timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function isCorrectPassword(password: string): boolean {
  const expected = process.env.APP_PASSWORD ?? '';
  return password.length === expected.length && timingSafeEqual(Buffer.from(password), Buffer.from(expected));
}
