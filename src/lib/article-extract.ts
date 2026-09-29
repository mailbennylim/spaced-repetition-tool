import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export interface ExtractedArticle {
  title: string;
  byline: string | null;
  siteName: string | null;
  excerpt: string | null;
  publishedAt: string | null;
  content: string;   // cleaned HTML
  textContent: string;
  ogImage: string | null;
}

export async function extractArticle(url: string): Promise<ExtractedArticle> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) throw new Error(`Couldn't load the page (${response.status})`);

  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  const meta = (sel: string) => doc.querySelector(sel)?.getAttribute('content') || null;
  const ogImage = meta('meta[property="og:image"]') || meta('meta[name="twitter:image"]');
  const siteName = meta('meta[property="og:site_name"]');
  const publishedAt = meta('meta[property="article:published_time"]') || meta('meta[name="date"]')
    || doc.querySelector('time[datetime]')?.getAttribute('datetime') || null;

  const reader = new Readability(doc);
  const article = reader.parse();
  if (!article?.content) throw new Error("Couldn't read this page. It may need a login or block automatic readers.");

  return {
    title: article.title || doc.title || 'Untitled',
    byline: article.byline || meta('meta[name="author"]') || null,
    siteName: article.siteName || siteName,
    excerpt: article.excerpt || meta('meta[property="og:description"]') || meta('meta[name="description"]'),
    publishedAt,
    content: article.content,
    textContent: article.textContent || '',
    ogImage,
  };
}
