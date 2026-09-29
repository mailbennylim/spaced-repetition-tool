/**
 * Server start-up hook: refresh RSS feeds every 30 minutes (docs/build-plan.md, Phase 3).
 * Runs only in the Node.js runtime, never in the edge runtime or during the build.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || process.env.NEXT_PHASE === 'phase-production-build') return;
  const cron = await import('node-cron');
  const { refreshAllFeeds } = await import('@/lib/rss');
  const g = globalThis as typeof globalThis & { __feedCron?: boolean };
  if (g.__feedCron) return;
  g.__feedCron = true;
  cron.schedule('*/30 * * * *', async () => {
    try { const r = await refreshAllFeeds(); if (r.added) console.log(`[feeds] ${r.added} new item(s) from ${r.feeds} feed(s)`); }
    catch (e) { console.error('[feeds] refresh failed', e); }
  });
}
