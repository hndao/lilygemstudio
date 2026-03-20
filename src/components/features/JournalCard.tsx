/**
 * JournalCard — magazine-style card for the /journal listing page.
 *
 * LAYOUT: full-bleed featured image (16:9), category badge, title, date.
 * Designed to feel editorial — wider aspect ratio than ProductCard.
 * No API calls — all data pre-fetched by the page RSC.
 */

import Image from 'next/image';
import Link from 'next/link';
import type { PostCard } from '@/types';

interface JournalCardProps {
  post: PostCard;
  /** Mark as priority for above-the-fold LCP images (first 2–3 cards) */
  priority?: boolean;
  sizes?: string;
}

export function JournalCard({
  post,
  priority = false,
  sizes = '(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw',
}: JournalCardProps) {
  const { slug, title, category, featuredImage, publishedAt } = post;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(publishedAt));

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl bg-(--color-surface) shadow-(--shadow-soft) transition-shadow duration-200 hover:shadow-(--shadow-card)">
      {/* Featured image — 16:9 aspect ratio */}
      <Link href={`/journal/${slug}`} className="relative block aspect-video overflow-hidden bg-(--color-sand-light)">
        {featuredImage?.src ? (
          <Image
            src={featuredImage.src}
            alt={featuredImage.alt}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
            <span className="text-xs text-stone-400">No image</span>
          </div>
        )}

        {/* Category badge overlay */}
        {category && (
          <div className="absolute left-3 top-3">
            <span className="inline-block rounded-full bg-(--color-stone)/80 px-3 py-1 text-xs font-500 uppercase tracking-wider text-(--color-cream) backdrop-blur-sm">
              {category}
            </span>
          </div>
        )}
      </Link>

      {/* Card content */}
      <div className="flex flex-1 flex-col gap-2 p-4 md:p-5">
        {/* Title */}
        <Link href={`/journal/${slug}`}>
          <h3 className="line-clamp-2 text-base font-600 leading-snug text-(--color-stone) transition-colors hover:text-(--color-sage) md:text-lg">
            {title}
          </h3>
        </Link>

        {/* Date */}
        <time
          dateTime={publishedAt}
          className="mt-auto text-xs text-(--color-muted)"
        >
          {formattedDate}
        </time>
      </div>
    </article>
  );
}

