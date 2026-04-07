'use client';

/**
 * ReviewsDialog — "View all reviews" trigger + centered modal panel.
 *
 * WHY fixed + translate centering (not m-auto):
 *   Native <dialog> has its own UA positioning; m-auto doesn't reliably center it.
 *
 * WHY inner wrapper div owns flex (not dialog itself):
 *   Tailwind's flex class sets display:flex, which overrides the browser's
 *   dialog:not([open]){display:none} rule — making the dialog always visible.
 *   Keeping flex on an inner div avoids this.
 *
 * Rating summary layout (mirrors Image #6):
 *   Left 2/3 — big score number + star icon + StarRating row + "N ratings"
 *   Right 1/3 — star distribution bars (5→1) with % labels
 */

import { useRef } from 'react';
import type { Review } from '@/types';
import { ReviewCard } from './ReviewCard';
import { StarRating } from '@/components/ui/StarRating';

interface ReviewsDialogDict {
  customer_reviews: string;
  reviews_for_item: string;
  view_all: string;
  ratings: string;
  no_reviews: string;
  be_first: string;
}

interface ReviewsDialogProps {
  reviews: Review[];
  totalCount: number;
  averageRating: number | null;
  dict: ReviewsDialogDict;
}

function computeDistribution(reviews: Review[]): Record<number, number> {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)));
    counts[star]++;
  }
  return counts;
}

export function ReviewsDialog({ reviews, totalCount, averageRating, dict }: ReviewsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const open  = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  const dist        = computeDistribution(reviews);
  const sampleTotal = reviews.length;

  return (
    <>
      {/* Trigger */}
      {totalCount > 3 && (
        <button
          onClick={open}
          className="mt-3 text-sm font-600 text-(--color-cta) underline underline-offset-2 hover:text-(--color-cta-hover)"
        >
          {dict.view_all} ({totalCount})
        </button>
      )}

      {/* Centered modal panel */}
      <dialog
        ref={dialogRef}
        onClick={(e) => { if (e.target === dialogRef.current) close(); }}
        className="fixed top-1/2 left-1/2 m-0 w-[calc(100vw-2rem)] max-w-[640px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-(--color-surface) p-0 shadow-2xl backdrop:bg-black/50"
        style={{ maxHeight: '85vh' }}
      >
        {/* Inner flex wrapper — NOT on <dialog> itself (see note above) */}
        <div className="flex flex-col" style={{ maxHeight: '85vh' }}>

          {/* ── Header ──────────────────────────────────────────────── */}
          <div className="flex shrink-0 items-center justify-between border-b border-(--color-border) px-6 py-4">
            <h2 className="font-heading text-[15px] font-700 text-(--color-stone)">
              {`${dict.reviews_for_item} (${totalCount})`}
            </h2>
            <button
              onClick={close}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-(--color-muted) transition-colors hover:bg-(--color-sand-light) hover:text-(--color-stone)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── Rating summary: left 2/3 score | right 1/3 bars ────── */}
          {averageRating !== null && sampleTotal > 0 && (
            <div className="shrink-0 border-b border-(--color-border) px-6 py-5">
              <div className="flex items-center gap-8">

                {/* Left 2/3 — big score */}
                <div className="flex shrink-0 basis-2/3 flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <svg className="shrink-0 text-(--color-terracotta-dark)" width="44" height="44" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span className="font-heading text-[52px] font-700 leading-none text-(--color-stone)">
                      {averageRating.toFixed(1)}
                    </span>
                  </div>
                  <StarRating rating={averageRating} size="md" />
                  <p className="text-[13px] text-(--color-muted)">{totalCount} {dict.ratings}</p>
                </div>

                {/* Right 1/3 — star distribution bars */}
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const pct = sampleTotal > 0 ? Math.round((dist[star] / sampleTotal) * 100) : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-[12px] text-(--color-muted)">
                        <span className="w-[38px] shrink-0 text-right">{star} star</span>
                        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#DDD8CF]">
                          <div
                            className="h-full rounded-full bg-(--color-terracotta-dark)"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-7 shrink-0 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          )}

          {/* ── Review list ─────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {reviews.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="flex gap-0.5 text-[28px] leading-none text-(--color-sand-dark)" aria-hidden="true">
                  {'☆'.repeat(5)}
                </div>
                <p className="text-[14px] font-600 text-(--color-stone)">{dict.no_reviews}</p>
                <p className="text-[13px] text-(--color-muted)">{dict.be_first}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </div>

        </div>
      </dialog>
    </>
  );
}
