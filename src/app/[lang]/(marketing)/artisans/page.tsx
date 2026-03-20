/**
 * /artisans — Artisan listing page (RSC + Suspense streaming).
 *
 * WHY RSC: All artisan cards are fetched server-side. Suspense lets the hero
 * render instantly while the grid streams in with a skeleton fallback.
 * ISR 3d — artisan profiles change infrequently.
 */

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getArtisans } from '@/lib/api';
import { ArtisanCard } from '@/components/features/ArtisanCard';
import { ArtisanGridSkeleton } from '@/components/features/ArtisanCardSkeleton';

export const revalidate = 259200; // 3 days — matches REVALIDATION.ARTISANS in cache.ts

const ARTISANS_DESCRIPTION =
  "Discover the makers behind DARIIV's curated collection — independent artisans crafting heirloom-quality goods from around the world.";

export const metadata: Metadata = {
  title: 'Meet the Artisans | DARIIV',
  description: ARTISANS_DESCRIPTION,
  openGraph: {
    title: 'Meet the Artisans | DARIIV',
    description: ARTISANS_DESCRIPTION,
    type: 'website',
  },
};

/** Async child — suspends while the artisan list is fetched */
async function ArtisansGrid() {
  const result = await getArtisans().catch(() => null);
  const artisans = result?.data ?? [];

  if (artisans.length === 0) {
    return (
      <p className="text-center text-(--color-muted)">
        Artisan profiles coming soon.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {artisans.map((artisan, i) => (
        <ArtisanCard
          key={artisan.id}
          artisan={artisan}
          priority={i < 4}
        />
      ))}
    </div>
  );
}

export default function ArtisansPage() {
  return (
    <main>
      {/* Page header — renders immediately */}
      <section className="bg-(--color-sand-light) py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8 text-center">
          <span className="brand-label">The Makers</span>
          <h1 className="mt-3">Meet the Artisans</h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-(--color-muted) leading-relaxed">
            Every product in our collection is made by an independent artisan.
            We tell their stories so you know exactly who made what you love.
          </p>
        </div>
      </section>

      {/* Artisan grid — streams in with skeleton while loading */}
      <section className="bg-(--color-background) py-16 md:py-24" aria-label="Artisan profiles">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8">
          <Suspense fallback={<ArtisanGridSkeleton count={8} />}>
            <ArtisansGrid />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

