import { format, isToday } from 'date-fns';

const WPM = 240;

export function readingMinutes(wordCount?: number | null): number | null {
  if (!wordCount) return null;
  return Math.max(1, Math.round(wordCount / WPM));
}

/** "5 mins", "1 hr 14 mins" */
export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'}`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `${h} hr ${m} min${m === 1 ? '' : 's'}` : `${h} hr`;
}

/** Reader's list time: "5 mins", or "1 hr 14 mins left" once started. */
export function timeLabel(wordCount?: number | null, progress = 0): string | null {
  const mins = readingMinutes(wordCount);
  if (!mins) return null;
  if (progress > 0.02 && progress < 0.98) return `${formatMinutes(Math.max(1, Math.round(mins * (1 - progress))))} left`;
  return formatMinutes(mins);
}

/** Reader's row date: "8:36 pm" today, otherwise "Sep 25th". */
export function rowDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return isToday(date) ? format(date, 'h:mm aaa') : format(date, 'MMM do');
}

export function domainOf(url?: string | null): string | null {
  if (!url) return null;
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
}

export function plainText(html?: string | null): string {
  return (html || '')
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}
