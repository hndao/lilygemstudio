/**
 * ProductCard — grid card for catalog and homepage featured section.
 *
 * PERFORMANCE RULES ENFORCED HERE:
 *  - next/image with explicit sizes — prevents oversized image downloads on mobile
 *  - blurDataURL (LQIP) — eliminates CLS during image load
 *  - priority prop passed through — caller decides which cards are LCP candidates
 *  - No API calls inside this component — all data is pre-fetched by the page RSC
 *
 * LAYOUT: image top, badge overlay top-left, content below (name, tagline, price, stars)
 */

import Image from 'next/image';
import Link from 'next/link';
import type { ProductCard as ProductCardType } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { PriceLine } from '@/components/ui/PriceLine';

interface ProductCardProps {
  product: ProductCardType;
  /** Mark as priority for above-the-fold LCP images (first 4–6 cards) */
  priority?: boolean;
  /**
   * Responsive sizes string — caller knows the grid context.
   * Homepage 4-col desktop: "(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw"
   */
  sizes?: string;
}

export function ProductCard({
  product,
  priority = false,
  sizes = '(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw',
}: ProductCardProps) {
  const { slug, name, tagline, price, compareAtPrice, coverImage, reviewSummary, badge } = product;

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg bg-(--color-surface) shadow-(--shadow-soft) transition-shadow duration-200 hover:shadow-(--shadow-card)">
      {/* Image wrapper — aspect-ratio locks height, prevents CLS */}
      <Link href={`/shop/${slug}`} className="relative block aspect-square overflow-hidden bg-(--color-sand-light)">
        <Image
          src={coverImage.src}
          alt={coverImage.alt}
          fill
          sizes={sizes}
          priority={priority}
          placeholder={coverImage.blurDataURL ? 'blur' : 'empty'}
          blurDataURL={coverImage.blurDataURL}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badge overlay — top-left, per wireframe */}
        {badge && (
          <div className="absolute left-2 top-2">
            <Badge variant={badge} />
          </div>
        )}
      </Link>

      {/* Card content */}
      <div className="flex flex-1 flex-col gap-1.5 p-3 md:p-4">
        {/* Product name */}
        <Link href={`/shop/${slug}`}>
          <h3 className="line-clamp-2 text-sm font-600 leading-snug text-(--color-stone) transition-colors hover:text-(--color-sage) md:text-base">
            {name}
          </h3>
        </Link>

        {/* Tagline — one-line hook, muted */}
        <p className="line-clamp-1 text-xs text-(--color-muted)">{tagline}</p>

        {/* Price + compare-at */}
        <PriceLine price={price} compareAtPrice={compareAtPrice} size="sm" className="mt-auto pt-1" />

        {/* Star rating */}
        <StarRating
          rating={reviewSummary.averageRating}
          count={reviewSummary.totalCount}
          size="sm"
        />
      </div>
    </article>
  );
}

