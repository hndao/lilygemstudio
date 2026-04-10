/**
 * ReviewGrid — masonry grid of ReviewCards.
 *
 * MASONRY COLUMNS (from wireframes):
 *  - Mobile  (< 768px):  1 column
 *  - Tablet  (768–1279px): 2 columns
 *  - Desktop (≥ 1280px): 3 columns
 *
 * WHY CSS COLUMNS (not grid): CSS `columns` property creates true masonry
 * where cards of varying heights fill columns naturally. CSS Grid masonry
 * is still experimental (not baseline). This approach works in all browsers.
 *
 * WHY SERVER COMPONENT: No interactivity. Data is pre-fetched by the RSC page.
 */

import type { Review } from '@/types';
import { ReviewCard } from './ReviewCard';

interface ReviewGridProps {
  reviews: Review[];
  totalCount: number;
  dict: { no_reviews: string; be_first: string; customer_reviews: string };
}

export function ReviewGrid({ reviews, totalCount, dict }: ReviewGridProps) {
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex gap-0.5 text-[32px] leading-none text-(--color-sand-dark)" aria-hidden="true">
          {'☆'.repeat(5)}
        </div>
        <p className="text-[15px] font-600 text-(--color-stone)">{dict.no_reviews}</p>
        <p className="text-[13px] text-(--color-muted)">{dict.be_first}</p>
      </div>
    );
  }

  return (
    <section aria-label={`${dict.customer_reviews} — ${totalCount} total`}>
      <h2 className="mb-6">{dict.customer_reviews} ({totalCount})</h2>

      {/*
       * CSS columns masonry:
       *  - columns-1: mobile (1 col)
       *  - md:columns-2: tablet (2 col)
       *  - xl:columns-3: desktop (3 col)
       * gap-4 sets the column gutter; break-inside-avoid on each card
       * prevents a card from splitting across columns.
       */}
      <div className="columns-1 gap-4 md:columns-2 xl:columns-3">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </section>
  );
}

