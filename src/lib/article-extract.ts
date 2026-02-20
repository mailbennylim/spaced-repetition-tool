import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export interface ExtractedArticle {
  title: string;
  byline: string | null;
  content: string;   // sanitised HTML
  textContent: string;
  ogImage: string | null;
}

export async function extractArticle(url: string): Promise<ExtractedArticle> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ReadingApp/1.0)',
      'Accept': 'text/html',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);

  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  // Extract OG image before Readability strips metadata
  const ogImage =
    doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
    null;

  const reader = new Readability(doc);
  const article = reader.parse();

  if (!article) throw new Error('Could not extract article content — the page may require a login or block scrapers.');

  return {
    title: article.title || 'Untitled',
    byline: article.byline || null,
    content: article.content,
    textContent: article.textContent,
    ogImage,
  };
}
