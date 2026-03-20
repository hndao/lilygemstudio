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
}

export function ReviewGrid({ reviews, totalCount }: ReviewGridProps) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-(--color-muted)">
        No reviews yet. Be the first to share your experience.
      </p>
    );
  }

  return (
    <section aria-label={`Customer reviews — ${totalCount} total`}>
      <h2 className="mb-6">Customer Reviews ({totalCount})</h2>

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

