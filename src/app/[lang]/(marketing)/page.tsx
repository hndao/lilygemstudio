/**
 * Homepage — React Server Component.
 *
 * WHY RSC: All data is fetched server-side before any HTML is sent.
 * Zero client-side waterfalls.
 *
 * SECTION STRATEGY:
 *  - Admin configures sections in Marketing → Home Page Sections in the admin panel.
 *  - API returns enabled sections with embedded listing cards in a single call.
 *  - When no sections are configured the section area is simply empty.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { getHomeSections, getSiteSettings } from '@/lib/api';
import { getDictionary } from '@/lib/i18n';
import { HeroSection } from '@/components/features/HeroSection';
import { AsSeenOnBar } from '@/components/features/AsSeenOnBar';
import { ListingGrid } from '@/components/features/ListingGrid';
import { OurStorySection } from '@/components/features/OurStorySection';

// ISR: revalidate every 24h — matches PRODUCT_LIST and SETTINGS TTL in cache.ts
export const revalidate = 86400;

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  // Fetch settings, sections + dictionary in parallel — zero sequential waterfalls.
  const [settings, sections, dict] = await Promise.all([
    getSiteSettings(),
    getHomeSections().catch(() => []),
    getDictionary(lang),
  ]);

  // Hero config
  const heroSlides     = settings?.hero?.hero_slides ?? [];
  const heroMode       = settings?.hero?.hero_mode ?? 'single';
  const heroPreloadUrl = heroSlides[0]?.image_url
    ?? 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=80';

  return (
    <main>
      {/* Explicit fetchpriority=high preload for the hero LCP image */}
      <link rel="preload" as="image" href={heroPreloadUrl} fetchPriority="high" />

      {/* 1. Hero */}
      <HeroSection slides={heroSlides} heroMode={heroMode} lang={lang} />

      {/* 2. Social proof bar */}
      <AsSeenOnBar social={settings?.social} />

      {/* 3. Dynamic product sections */}
      {sections.map((section, i) => {
        if (!section.listings.length) return null;

        const title    = lang === 'vi' ? (section.title_vi    || section.title_en) : section.title_en;
        const subtitle = lang === 'vi' ? (section.subtitle_vi || section.subtitle_en) : section.subtitle_en;

        return (
          <section
            key={section.id}
            className="bg-(--color-background) py-10 md:py-14"
            aria-labelledby={`section-heading-${section.id}`}
          >
            <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8">
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <span className="brand-label">{title}</span>
                  {subtitle && (
                    <h2 id={`section-heading-${section.id}`} className="mt-2">
                      {subtitle}
                    </h2>
                  )}
                </div>
                {section.show_view_all && (
                  <Link
                    href={section.view_all_url || '/shop'}
                    className="hidden text-sm font-500 text-(--color-sage) transition-colors hover:text-(--color-sage-dark) md:block"
                  >
                    {dict.home.view_all}
                  </Link>
                )}
              </div>

              <Suspense fallback={<ProductGridSkeleton />}>
                <ListingGrid listings={section.listings} priorityCount={i === 0 ? 4 : 0} />
              </Suspense>

              <div className="mt-8 text-center md:hidden">
                <Link
                  href="/shop"
                  className="inline-block rounded-md border border-(--color-cta) px-6 py-2.5 font-heading text-sm font-600 text-(--color-cta) transition-colors hover:bg-(--color-cta) hover:text-white"
                >
                  {dict.home.load_more}
                </Link>
              </div>
            </div>
          </section>
        );
      })}

      {/* 4. Our Story editorial section */}
      <OurStorySection content={settings?.pages?.page_home} lang={lang} />
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
