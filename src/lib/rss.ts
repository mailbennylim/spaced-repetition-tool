import Parser from 'rss-parser';
import { prisma } from '@/lib/prisma';
import { domainOf, plainText } from '@/lib/format';

const UA = 'Mozilla/5.0 (compatible; Reader/1.0; +https://example.invalid)';

const parser = new Parser({
  timeout: 20000,
  headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' },
  customFields: { item: [['content:encoded', 'contentEncoded'], ['media:content', 'mediaContent', { keepArray: true }], ['media:thumbnail', 'mediaThumbnail']] },
});

export interface FeedCandidate {
  title: string;
  url: string;          // feed URL
  siteUrl?: string | null;
  description?: string | null;
  iconUrl?: string | null;
  subscribers?: number | null;
  lastUpdated?: string | null;
  source: 'feedly' | 'site' | 'direct';
}

function normalizeSite(input: string): string {
  let u = input.trim();
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u;
}

/** Search Feedly's public index by name. Free, no account; may change without notice (docs/ux-spec.md §3.3.1). */
export async function searchFeedly(query: string): Promise<FeedCandidate[]> {
  try {
    const res = await fetch(`https://cloud.feedly.com/v3/search/feeds?query=${encodeURIComponent(query)}&count=12`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).map((r: Record<string, unknown>) => ({
      title: String(r.title ?? ''),
      url: String(r.feedId ?? '').replace(/^feed\//, ''),
      siteUrl: (r.website as string) ?? null,
      description: (r.description as string) ?? null,
      iconUrl: (r.iconUrl as string) ?? (r.visualUrl as string) ?? null,
      subscribers: (r.subscribers as number) ?? null,
      lastUpdated: r.lastUpdated ? new Date(r.lastUpdated as number).toISOString() : null,
      source: 'feedly' as const,
    })).filter((c: FeedCandidate) => c.url.startsWith('http'));
  } catch { return []; }
}

/** Find feeds a site advertises (<link rel="alternate">) plus the usual well-known paths. */
export async function discoverFromSite(input: string): Promise<FeedCandidate[]> {
  const site = normalizeSite(input);
  const out = new Map<string, FeedCandidate>();
  const tryFeed = async (url: string) => {
    if (out.has(url)) return;
    try {
      const feed = await parser.parseURL(url);
      out.set(url, { title: feed.title?.trim() || domainOf(url) || url, url, siteUrl: feed.link ?? site, description: feed.description?.trim() || null, iconUrl: feed.image?.url ?? null, lastUpdated: feed.items?.[0]?.isoDate ?? null, source: 'site' });
    } catch { /* not a feed */ }
  };

  // 1. The URL itself might be a feed
  await tryFeed(site);
  if (out.size) return [...out.values()];

  // 2. Advertised feeds in the HTML
  try {
    const res = await fetch(site, { headers: { 'User-Agent': UA, Accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(12000) });
    const html = await res.text();
    const links = [...html.matchAll(/<link[^>]+>/gi)].map(m => m[0]).filter(l => /rel=["']?alternate/i.test(l) && /(rss|atom|xml|json)/i.test(l));
    const hrefs = links.map(l => l.match(/href=["']([^"']+)/i)?.[1]).filter(Boolean) as string[];
    await Promise.all(hrefs.slice(0, 5).map(h => tryFeed(new URL(h, res.url || site).toString())));
  } catch { /* ignore */ }

  // 3. Common paths (Substack, Medium, WordPress, Ghost, YouTube…)
  if (!out.size) {
    const u = new URL(site);
    const base = `${u.protocol}//${u.host}`;
    const paths = ['/feed', '/rss', '/feed.xml', '/rss.xml', '/atom.xml', '/index.xml', '/feed/rss', '/blog/feed', '/blog/rss'];
    if (u.host.endsWith('medium.com')) paths.unshift(u.pathname.startsWith('/@') ? `/feed${u.pathname}` : `/feed${u.pathname.replace(/\/$/, '')}`);
    await Promise.all(paths.map(p => tryFeed(base + p)));
  }
  return [...out.values()];
}

export async function searchFeeds(query: string): Promise<FeedCandidate[]> {
  const q = query.trim();
  if (!q) return [];
  const looksLikeUrl = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(q);
  const [fromSite, fromFeedly] = await Promise.all([looksLikeUrl ? discoverFromSite(q) : Promise.resolve([]), searchFeedly(q)]);
  const seen = new Set<string>();
  return [...fromSite, ...fromFeedly].filter(c => { const k = c.url.replace(/\/$/, ''); if (seen.has(k)) return false; seen.add(k); return true; });
}

// ── Fetching items ───────────────────────────────────────────────────────────

type Item = Parser.Item & { contentEncoded?: string; mediaContent?: { $?: { url?: string } }[]; mediaThumbnail?: { $?: { url?: string } } };

function itemImage(item: Item, html: string): string | null {
  const media = item.mediaContent?.find(m => m.$?.url)?.$?.url || item.mediaThumbnail?.$?.url;
  if (media) return media;
  if (item.enclosure?.url && /image/.test(item.enclosure.type ?? '')) return item.enclosure.url;
  const img = html.match(/<img[^>]+src=["']([^"']+)/i)?.[1];
  return img ?? null;
}

/** Fetch a feed and store new items as Feed documents. Returns how many were added. */
export async function refreshFeed(feedId: string): Promise<number> {
  const feed = await prisma.feed.findUnique({ where: { id: feedId } });
  if (!feed || feed.kind !== 'rss') return 0;
  let parsed: Parser.Output<Item>;
  try {
    parsed = await parser.parseURL(feed.url) as Parser.Output<Item>;
  } catch (e) {
    await prisma.feed.update({ where: { id: feedId }, data: { lastFetchedAt: new Date(), lastError: e instanceof Error ? e.message : 'Fetch failed' } });
    return 0;
  }

  let added = 0, newest: Date | null = feed.lastItemAt;
  for (const item of (parsed.items ?? []).slice(0, 50)) {
    const url = item.link?.trim();
    const guid = item.guid || url || item.title;
    if (!guid) continue;
    const exists = await prisma.document.findFirst({ where: { feedId, OR: [{ url: url || undefined }, { savedUsing: `rss:${guid}` }] }, select: { id: true } });
    if (exists) continue;
    const html = item.contentEncoded || item.content || item.summary || '';
    const text = plainText(html);
    const published = item.isoDate ? new Date(item.isoDate) : new Date();
    await prisma.document.create({
      data: {
        title: item.title?.trim() || 'Untitled',
        author: item.creator || (item as { author?: string }).author || null,
        type: 'rss',
        url: url || null,
        domain: domainOf(url) || domainOf(feed.siteUrl) || null,
        siteName: feed.title,
        excerpt: (item.contentSnippet || text).slice(0, 280) || null,
        content: html || null,
        imageUrl: itemImage(item, html),
        wordCount: text ? text.split(' ').length : null,
        publishedAt: published,
        isFeed: true,
        location: 'inbox',
        feedId,
        savedUsing: `rss:${guid}`,
        savedAt: published,
        movedAt: published,
      },
    });
    added++;
    if (!newest || published > newest) newest = published;
  }
  await prisma.feed.update({ where: { id: feedId }, data: { lastFetchedAt: new Date(), lastItemAt: newest, lastError: null, title: feed.title || parsed.title || feed.title, iconUrl: feed.iconUrl ?? parsed.image?.url ?? null } });
  return added;
}

export async function refreshAllFeeds(): Promise<{ feeds: number; added: number }> {
  const feeds = await prisma.feed.findMany({ where: { kind: 'rss' }, select: { id: true } });
  let added = 0;
  // Sequential, gently: this runs on a home Mac mini.
  for (const f of feeds) added += await refreshFeed(f.id);
  return { feeds: feeds.length, added };
}

/** Subscribe to a feed URL (validates it by fetching once). */
export async function subscribe(url: string, meta?: Partial<FeedCandidate>) {
  const existing = await prisma.feed.findUnique({ where: { url } });
  if (existing) return existing;
  const parsed = await parser.parseURL(url);
  const feed = await prisma.feed.create({
    data: {
      kind: 'rss',
      url,
      title: meta?.title || parsed.title?.trim() || domainOf(url) || url,
      siteUrl: meta?.siteUrl || parsed.link || null,
      iconUrl: meta?.iconUrl || parsed.image?.url || (parsed.link ? `https://icons.duckduckgo.com/ip3/${domainOf(parsed.link)}.ico` : null),
      description: meta?.description || parsed.description?.trim() || null,
    },
  });
  await refreshFeed(feed.id);
  return feed;
}
