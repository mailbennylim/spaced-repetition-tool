import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

/** Inbound email addresses: two random tokens (library / feed) plus the configured domain. */
export async function GET() {
  const settings = (await prisma.settings.findFirst()) ?? (await prisma.settings.create({ data: {} }));
  const data: Record<string, string> = {};
  if (!settings.libraryEmailToken) data.libraryEmailToken = randomBytes(5).toString('hex');
  if (!settings.feedEmailToken) data.feedEmailToken = randomBytes(5).toString('hex');
  const s = Object.keys(data).length ? await prisma.settings.update({ where: { id: settings.id }, data }) : settings;
  return NextResponse.json({ domain: process.env.EMAIL_DOMAIN || '', libraryEmailToken: s.libraryEmailToken, feedEmailToken: s.feedEmailToken });
}
