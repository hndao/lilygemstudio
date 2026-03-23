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
import { useParams } from 'next/navigation';
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
  const { slug, name, nameVi, tagline, taglineVi, price, compareAtPrice, priceVnd, compareAtPriceVnd, coverImage, reviewSummary, badge } = product;

  // Since ProductCard is rendered by ProductGrid (a Client Component),
  // it implicitly runs on the client and can use useParams.
  const params = useParams();
  const lang = (params?.lang as string) || 'vi';

  const displayName = lang === 'vi' && nameVi ? nameVi : name;
  const displayTagline = lang === 'vi' && taglineVi ? taglineVi : tagline;

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg bg-(--color-surface) shadow-(--shadow-soft) transition-shadow duration-200 hover:shadow-(--shadow-card)">
      {/* Image wrapper — aspect-ratio locks height, prevents CLS */}
      <Link href={`/${lang}/shop/${slug}`} className="relative block aspect-square overflow-hidden bg-(--color-sand-light)">
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

      {/* Content area: Name, Tagline, Price, Rating */}
      <div className="flex flex-1 flex-col p-4">
        {/* Row 1: Name */}
        <Link href={`/${lang}/shop/${slug}`} className="outline-none">
          <h3 className="line-clamp-2 font-heading text-base font-semibold text-(--color-foreground) transition-colors group-hover:text-(--color-terracotta)">
            {displayName}
          </h3>
        </Link>

        {/* Optional Tagline */}
        {displayTagline && (
          <p className="mt-1.5 line-clamp-1 text-sm text-(--color-muted)">
            {displayTagline}
          </p>
        )}
        {/* Price + compare-at */}
        <PriceLine 
          price={price} 
          compareAtPrice={compareAtPrice} 
          priceVnd={priceVnd} 
          compareAtPriceVnd={compareAtPriceVnd} 
          size="sm" 
          className="mt-auto pt-1" 
        />

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

