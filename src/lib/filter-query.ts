import type { Prisma } from '@prisma/client';
import { subDays, subWeeks, subMonths, subYears } from 'date-fns';

/**
 * Filter query language (docs/ux-spec.md Appendix B).
 *   field:value  field__op:value   AND / OR   ( )   "quoted values"
 * Fields: saved last_opened published (dates) · tag domain author title type in feed_source (text)
 *         feed seen (bool) · words progress highlights minutes (numbers) · has:highlights|tags|notes
 * Ops:    __gt __lt __gte __lte __contains __exact __before __after __not
 */

type Token = { kind: 'term'; field: string; op: string; value: string } | { kind: 'and' } | { kind: 'or' } | { kind: '(' } | { kind: ')' };

function tokenize(input: string): Token[] {
  const out: Token[] = [];
  const re = /\s*(?:(\()|(\))|(AND)\b|(OR)\b|([a-z_]+)(?:__([a-z]+))?:(?:"([^"]*)"|(\S+))|"([^"]*)"|(\S+))/giy;
  let m: RegExpExecArray | null;
  re.lastIndex = 0;
  while (re.lastIndex < input.length && (m = re.exec(input))) {
    if (m[1]) out.push({ kind: '(' });
    else if (m[2]) out.push({ kind: ')' });
    else if (m[3]) out.push({ kind: 'and' });
    else if (m[4]) out.push({ kind: 'or' });
    else if (m[5]) out.push({ kind: 'term', field: m[5].toLowerCase(), op: (m[6] || '').toLowerCase(), value: m[7] ?? m[8] ?? '' });
    else if (m[9] !== undefined || m[10]) out.push({ kind: 'term', field: 'text', op: 'contains', value: m[9] ?? m[10] });
    if (m[0].length === 0) break;
  }
  return out;
}

function relativeDate(v: string): Date | null {
  const abs = new Date(v);
  if (!Number.isNaN(abs.getTime()) && /\d{4}-\d{2}-\d{2}/.test(v)) return abs;
  const m = v.trim().toLowerCase().match(/^(\d+)\s*(day|week|month|year)s?\s*ago$/);
  if (!m) return null;
  const n = Number(m[1]);
  return ({ day: subDays, week: subWeeks, month: subMonths, year: subYears })[m[2] as 'day'](new Date(), n);
}

const TYPE_ALIASES: Record<string, string> = { book: 'epub', books: 'epub', articles: 'article', pdfs: 'pdf', emails: 'email', newsletter: 'email', feed: 'rss' };

function termToWhere(t: Extract<Token, { kind: 'term' }>): Prisma.DocumentWhereInput {
  const { field, value } = t;
  let op = t.op;
  let negate = false;
  if (op === 'not') { negate = true; op = ''; }
  const wrap = (w: Prisma.DocumentWhereInput): Prisma.DocumentWhereInput => (negate ? { NOT: w } : w);

  const dateField = ({ saved: 'savedAt', last_opened: 'lastOpenedAt', published: 'publishedAt', last_status: 'movedAt' } as Record<string, keyof Prisma.DocumentWhereInput>)[field];
  if (dateField) {
    const d = relativeDate(value); if (!d) return {};
    // "saved__gt:'1 week ago'" reads as "saved more recently than a week ago"
    const after = op === 'after' || op === 'gt' || op === 'gte';
    const before = op === 'before' || op === 'lt' || op === 'lte';
    if (after) return wrap({ [dateField]: { gte: d } } as Prisma.DocumentWhereInput);
    if (before) return wrap({ [dateField]: { lte: d } } as Prisma.DocumentWhereInput);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    return wrap({ [dateField]: { gte: d, lt: next } } as Prisma.DocumentWhereInput);
  }

  const numField = ({ words: 'wordCount', progress: 'progress', minutes: 'wordCount' } as Record<string, string>)[field];
  if (numField || field === 'highlights') {
    let n = Number(value); if (Number.isNaN(n)) return {};
    if (field === 'minutes') n = n * 240;             // minutes → words at 240 wpm
    if (field === 'progress') n = n / 100;            // percent → 0–1
    const cmp = op === 'gt' ? 'gt' : op === 'lt' ? 'lt' : op === 'gte' ? 'gte' : op === 'lte' ? 'lte' : 'equals';
    if (field === 'highlights') {
      if (cmp === 'gt' || cmp === 'gte') return wrap({ highlights: { some: {} } }); // approximation: any highlights
      if (cmp === 'equals' && n === 0) return wrap({ highlights: { none: {} } });
      return wrap({ highlights: { some: {} } });
    }
    return wrap({ [numField]: { [cmp]: n } } as Prisma.DocumentWhereInput);
  }

  switch (field) {
    case 'tag': return wrap({ tags: { some: { tag: { name: op === 'contains' ? { contains: value } : value } } } });
    case 'domain': return wrap({ domain: op === 'exact' ? value : { contains: value.replace(/^www\./, '') } });
    case 'author': return wrap({ author: op === 'exact' ? value : { contains: value } });
    case 'title': return wrap({ title: op === 'exact' ? value : { contains: value } });
    case 'category': case 'type': return wrap({ type: TYPE_ALIASES[value.toLowerCase()] ?? value.toLowerCase() });
    case 'in': case 'location': return wrap({ isFeed: false, location: value.toLowerCase() });
    case 'feed': return wrap({ isFeed: value === 'true' });
    case 'seen': return wrap({ seen: value === 'true' });
    case 'feed_source': case 'rss_source': case 'rsssource': return wrap({ OR: [{ feedId: value }, { feed: { title: { contains: value } } }] });
    case 'has':
      if (value === 'highlights') return wrap({ highlights: { some: {} } });
      if (value === 'tags') return wrap({ tags: { some: {} } });
      if (value === 'notes' || value === 'note') return wrap({ note: { not: null } });
      return {};
    case 'text': return wrap({ OR: [{ title: { contains: value } }, { author: { contains: value } }, { excerpt: { contains: value } }] });
    default: return {};
  }
}

/** Parse a filter query into a Prisma where clause. Throws on unbalanced parentheses. */
export function parseFilterQuery(input: string): Prisma.DocumentWhereInput {
  const tokens = tokenize(input);
  let i = 0;
  const parseOr = (): Prisma.DocumentWhereInput => {
    const parts = [parseAnd()];
    while (tokens[i]?.kind === 'or') { i++; parts.push(parseAnd()); }
    return parts.length === 1 ? parts[0] : { OR: parts };
  };
  const parseAnd = (): Prisma.DocumentWhereInput => {
    const parts = [parseAtom()];
    while (tokens[i] && tokens[i].kind !== 'or' && tokens[i].kind !== ')') { if (tokens[i].kind === 'and') i++; parts.push(parseAtom()); }
    return parts.length === 1 ? parts[0] : { AND: parts };
  };
  const parseAtom = (): Prisma.DocumentWhereInput => {
    const t = tokens[i++];
    if (!t) return {};
    if (t.kind === '(') { const inner = parseOr(); if (tokens[i]?.kind === ')') i++; else throw new Error('Missing )'); return inner; }
    if (t.kind === 'term') return termToWhere(t);
    return {};
  };
  if (!tokens.length) return {};
  const where = parseOr();
  if (i < tokens.length) throw new Error('Unexpected token');
  return where;
}

export const DEFAULT_VIEWS: { name: string; query: string }[] = [
  { name: '⏱ Quick reads', query: 'minutes__lt:10 AND in:inbox' },
  { name: '⏳ Long reads', query: 'minutes__gt:30 AND in:inbox' },
  { name: '💎 Recently highlighted', query: 'has:highlights AND last_opened__gt:"1 week ago"' },
];
