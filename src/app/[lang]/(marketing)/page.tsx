/**
 * Homepage — React Server Component.
 *
 * WHY RSC: All product data is fetched here, server-side, before any HTML
 * is sent to the browser. Zero client-side waterfalls. The ProductGrid
 * receives pre-fetched data as props — no useEffect, no loading spinners.
 *
 * DATA STRATEGY:
 *  - Featured products: top 8 by rating, ISR 24h (PRODUCT_LIST TTL)
 *  - No N+1: single getProducts() call returns all 8 cards with review summaries
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { getListings, getSiteSettings } from '@/lib/api';
import { HeroSection } from '@/components/features/HeroSection';
import { AsSeenOnBar } from '@/components/features/AsSeenOnBar';
import { ListingGrid } from '@/components/features/ListingGrid';
import { OurStorySection } from '@/components/features/OurStorySection';

// ISR: revalidate every 24h — matches PRODUCT_LIST and SETTINGS TTL in cache.ts
export const revalidate = 86400;

export default async function HomePage() {
  // Fetch settings and products in parallel — no sequential waterfall.
  // Both calls are ISR-cached (24h) so they add zero DB load on repeat visits.
  const [settingsResult, listingsResult] = await Promise.allSettled([
    getSiteSettings(),
    getListings({ perPage: 8, platform: 'direct' }),
  ]);

  const settings = settingsResult.status === 'fulfilled' ? settingsResult.value : null;
  const featuredListings = listingsResult.status === 'fulfilled' ? listingsResult.value.data : [];

  // Use the first hero slide from settings; HeroSection has its own fallback
  const heroSlide = settings?.hero?.hero_slides?.[0];

  // Preload URL — use the CMS image if available, otherwise the fallback
  const heroPreloadUrl = heroSlide?.image_url
    ?? 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=80';

  return (
    <main>
      {/* Explicit fetchpriority=high preload for the hero image.
          Next.js cannot emit this automatically for external-URL fill images,
          so we add it here in the RSC to guarantee the browser fetches it
          during HTML parsing — before any JS executes. */}
      <link
        rel="preload"
        as="image"
        href={heroPreloadUrl}
        fetchPriority="high"
      />

      {/* 1. Hero — full-bleed, LCP image. slide prop drives all content from CMS. */}
      <HeroSection slide={heroSlide} />

      {/* 2. Social proof bar — only shows platforms configured in Settings → Social Links */}
      <AsSeenOnBar social={settings?.social} />

      {/* 3. Featured Products */}
      <section className="bg-(--color-background) py-16 md:py-24" aria-labelledby="featured-heading">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <span className="brand-label">Featured Products</span>
              <h2 id="featured-heading" className="mt-2">
                Handpicked for You
              </h2>
            </div>
            <Link
              href="/shop"
              className="hidden text-sm font-500 text-(--color-sage) transition-colors hover:text-(--color-sage-dark) md:block"
            >
              View all →
            </Link>
          </div>

          <Suspense fallback={<ProductGridSkeleton />}>
            <ListingGrid
              listings={featuredListings}
              priorityCount={4}
            />
          </Suspense>

          {/* Mobile "Load More" link — desktop shows "View all" in header */}
          <div className="mt-8 text-center md:hidden">
            <Link
              href="/shop"
              className="inline-block rounded-md border border-(--color-cta) px-6 py-2.5 font-heading text-sm font-600 text-(--color-cta) transition-colors hover:bg-(--color-cta) hover:text-white"
            >
              Load More
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Our Story editorial section */}
      <OurStorySection />
    </main>
  );
}

// Skeleton shown during Suspense boundary — prevents layout shift
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4 xl:gap-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-square animate-pulse rounded-lg bg-(--color-sand)" />
      ))}
    </div>
  );
}

