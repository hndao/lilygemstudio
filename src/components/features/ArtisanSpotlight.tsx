/**
 * ArtisanSpotlight — compact artisan bio embedded on the product detail page.
 *
 * WHY COMPACT: The product detail page is already content-heavy. This component
 * surfaces just enough to build trust (face, name, location, one-liner) and
 * drives traffic to the full artisan profile via a "Meet the Artisan" link.
 *
 * PLACEMENT: Below the AffiliateDisclosure, above the product specs/tabs.
 */

import Image from 'next/image';
import Link from 'next/link';
import type { ArtisanCard } from '@/types';

interface ArtisanSpotlightProps {
  artisan: ArtisanCard;
}

export function ArtisanSpotlight({ artisan }: ArtisanSpotlightProps) {
  const { slug, name, location, avatar, bioShort } = artisan;

  return (
    <aside
      aria-label={`About the artisan: ${name}`}
      className="flex items-start gap-4 rounded-xl border border-(--color-sand) bg-(--color-sand-light)/40 p-4"
    >
      {/* Avatar */}
      <Link href={`/artisans/${slug}`} className="shrink-0" tabIndex={-1} aria-hidden>
        <div className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-(--color-sand)">
          <Image
            src={avatar.src}
            alt={`Portrait of ${name}`}
            fill
            sizes="56px"
            className="object-cover"
          />
        </div>
      </Link>

      {/* Text content */}
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-xs font-500 uppercase tracking-wider text-(--color-muted)">
          Made by
        </p>
        <Link
          href={`/artisans/${slug}`}
          className="text-sm font-600 text-(--color-stone) hover:text-(--color-sage) transition-colors"
        >
          {name}
        </Link>
        {location && (
          <p className="text-xs text-(--color-muted)">{location}</p>
        )}
        {bioShort && (
          <p className="mt-1 line-clamp-2 text-xs text-(--color-stone)/70 leading-relaxed">
            {bioShort}
          </p>
        )}
        <Link
          href={`/artisans/${slug}`}
          className="mt-2 text-xs font-500 text-(--color-sage) hover:text-(--color-sage-dark) underline-offset-2 hover:underline transition-colors"
        >
          Meet the artisan →
        </Link>
      </div>
    </aside>
  );
}

