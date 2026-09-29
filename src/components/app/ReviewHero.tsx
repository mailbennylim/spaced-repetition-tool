'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface ReviewSummary { due: number; total: number; sources: string[]; doneToday: boolean; reviewedToday: number }

/** Daily Review hero (docs/ux-spec.md §3.1.1): Readwise's blue gradient card. */
export default function ReviewHero({ review, large }: { review: ReviewSummary | null; large?: boolean }) {
  const done = review?.doneToday;
  const subtitle = !review ? '' : done
    ? `You reviewed ${review.reviewedToday} highlight${review.reviewedToday === 1 ? '' : 's'} today`
    : review.total === 0 ? 'Highlight something to start reviewing'
    : `${review.due} highlight${review.due === 1 ? '' : 's'} from ${review.sources.slice(0, 2).join(', ')}${review.sources.length > 2 ? ' and more' : ''}`;
  return (
    <div className="mb-5 rounded-[10px] p-4 shadow-[0_4px_6px_rgba(0,0,0,.2)]" style={{ background: 'linear-gradient(121deg,#5278fe,#478cd0)' }}>
      <h2 className={`font-serif font-bold text-white ${large ? 'text-[32px] leading-9' : 'text-[26px] leading-8'}`}>Daily Review</h2>
      <p className="mt-1 min-h-[18px] text-[13px] font-bold text-white/90">{subtitle}</p>
      <div className="mt-3 flex justify-end gap-2">
        {large && <Link href="/settings/review" className="rounded-[10px] border border-white/80 px-4 py-2 text-[14px] font-bold text-white">Configure</Link>}
        <Link href="/review/session" className="flex items-center gap-1 rounded-[10px] bg-white px-4 py-2 text-[14px] font-bold text-[#478cd0]">
          {done ? '✓ Done for today' : review && review.total > 0 && review.due < review.total ? 'Continue' : 'Start'} <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}
