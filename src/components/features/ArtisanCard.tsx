/**
 * ArtisanCard — grid card for the /artisans listing page.
 *
 * LAYOUT: circular avatar top-center, name, location, bio_short, product count badge.
 * Mirrors the ProductCard pattern: no API calls, all data pre-fetched by the page RSC.
 */

import Image from 'next/image';
import Link from 'next/link';
import type { ArtisanCard as ArtisanCardType } from '@/types';

interface ArtisanCardProps {
  artisan: ArtisanCardType;
  /** Mark as priority for above-the-fold LCP images (first 4–6 cards) */
  priority?: boolean;
}

export function ArtisanCard({ artisan, priority = false }: ArtisanCardProps) {
  const { slug, name, location, avatar, bioShort, productCount } = artisan;

  return (
    <article className="group flex flex-col items-center gap-4 rounded-xl bg-(--color-surface) p-6 text-center shadow-(--shadow-soft) transition-shadow duration-200 hover:shadow-(--shadow-card)">
      {/* Circular avatar */}
      <Link href={`/artisans/${slug}`} className="relative block h-24 w-24 shrink-0 overflow-hidden rounded-full ring-2 ring-(--color-sand) transition-all duration-300 group-hover:ring-(--color-sage)">
        <Image
          src={avatar.src}
          alt={avatar.alt}
          fill
          sizes="96px"
          priority={priority}
          className="object-cover"
        />
      </Link>

      {/* Name */}
      <div className="flex flex-col gap-1">
        <Link href={`/artisans/${slug}`}>
          <h3 className="text-base font-600 text-(--color-stone) transition-colors hover:text-(--color-sage)">
            {name}
          </h3>
        </Link>

        {/* Location */}
        {location && (
          <p className="text-xs text-(--color-muted)">{location}</p>
        )}
      </div>

      {/* Bio short */}
      {bioShort && (
        <p className="line-clamp-3 text-sm text-(--color-stone)/70 leading-relaxed">
          {bioShort}
        </p>
      )}

      {/* Product count badge */}
      {productCount !== undefined && productCount > 0 && (
        <span className="mt-auto inline-flex items-center gap-1 rounded-full bg-(--color-sand-light) px-3 py-1 text-xs font-500 text-(--color-stone)">
          {productCount} {productCount === 1 ? 'product' : 'products'}
        </span>
      )}
    </article>
  );
}

