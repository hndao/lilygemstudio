/**
 * ReviewCard — single review in the masonry grid.
 *
 * WHY SERVER COMPONENT: No interactivity needed. Renders static review data
 * passed from the RSC page. Keeping it as a server component avoids adding
 * it to the client bundle.
 *
 * MASONRY LAYOUT: The parent ReviewGrid uses CSS columns for masonry.
 * This card uses break-inside-avoid to prevent column breaks mid-card.
 */

import Image from 'next/image';
import { CheckCircle } from 'lucide-react';
import type { Review } from '@/types';
import { StarRating } from '@/components/ui/StarRating';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const { authorName, rating, title, body, verifiedPurchase, images, publishedAt } = review;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(publishedAt));

  return (
    <article
      className="break-inside-avoid mb-4 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 shadow-(--shadow-soft)"
      aria-label={`Review by ${authorName}`}
    >
      {/* Author + verified badge */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading text-sm font-600 text-(--color-stone)">{authorName}</p>
          <time
            dateTime={publishedAt}
            className="text-xs text-(--color-muted)"
          >
            {formattedDate}
          </time>
        </div>
        {verifiedPurchase && (
          <div className="flex items-center gap-1 text-xs text-(--color-sage)" aria-label="Verified purchase">
            <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Verified</span>
          </div>
        )}
      </div>

      {/* Rating */}
      <StarRating rating={rating} size="sm" className="mt-2" />

      {/* Review title */}
      {title && (
        <p className="mt-2 font-heading text-sm font-600 text-(--color-stone)">{title}</p>
      )}

      {/* Review body */}
      <p className="mt-1.5 text-sm leading-relaxed text-(--color-muted)">{body}</p>

      {/* Review photos */}
      {images.length > 0 && (
        <div className="mt-3 flex gap-2">
          {images.slice(0, 3).map((img, i) => (
            <div
              key={i}
              className="relative h-16 w-16 overflow-hidden rounded-md bg-(--color-sand-light)"
            >
              <Image
                src={img.src}
                alt={img.alt || `Review photo ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

