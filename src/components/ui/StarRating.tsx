/**
 * StarRating — renders filled/half/empty stars with accessible label.
 *
 * WHY CUSTOM (not a library): We need pixel-perfect control over the
 * half-star rendering and the sage colour from our design system.
 * A library would add ~8KB for something we can do in 40 lines.
 */

import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;       // 1–5, supports one decimal (e.g. 4.8)
  count?: number;       // review count — shown as "(312)" when provided
  size?: 'sm' | 'md';  // sm = grid cards, md = product detail
  className?: string;
}

export function StarRating({ rating, count, size = 'sm', className = '' }: StarRatingProps) {
  const starSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  // Build 5 stars: filled if i < floor(rating), partial if fractional, empty otherwise
  const stars = Array.from({ length: 5 }, (_, i) => {
    const filled = i < Math.floor(rating);
    const partial = !filled && i < rating;
    return { filled, partial };
  });

  return (
    <div
      className={`flex items-center gap-1 ${className}`}
      aria-label={`${rating.toFixed(1)} out of 5 stars${count !== undefined ? `, ${count} reviews` : ''}`}
      role="img"
    >
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {stars.map(({ filled, partial }, i) => (
          <span key={i} className="relative inline-block">
            {/* Empty star base */}
            <Star className={`${starSize} text-(--color-sand-dark)`} />
            {/* Filled overlay — clip to 50% for partial */}
            {(filled || partial) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? '100%' : '50%' }}
              >
                <Star className={`${starSize} fill-(--color-terracotta) text-(--color-terracotta)`} />
              </span>
            )}
          </span>
        ))}
      </div>

      {/* Numeric rating */}
      <span className={`font-body font-500 text-(--color-stone) ${textSize}`}>
        {rating.toFixed(1)}
      </span>

      {/* Review count */}
      {count !== undefined && (
        <span className={`text-(--color-muted) ${textSize}`}>({count})</span>
      )}
    </div>
  );
}

