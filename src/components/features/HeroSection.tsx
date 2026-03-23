/**
 * HeroSection — full-bleed hero with headline and CTA.
 *
 * BREAKPOINT BEHAVIOUR (from wireframes):
 *  - Mobile:  full-height hero, stacked text + CTA
 *  - Tablet:  max-h-[60vh] — shorter to show content below the fold
 *  - Desktop: max-h-[80vh]
 *
 * WHY RSC WRAPPER + CLIENT CONTENT SPLIT:
 *  Next.js only emits a <link rel="preload" fetchpriority="high"> for priority
 *  images rendered in Server Components. When the entire HeroSection was a
 *  'use client' component (needed for Framer Motion), the preload hint was
 *  absent from the initial HTML — Lighthouse flagged this as "fetchpriority=high
 *  should be applied: false", causing LCP to be 3.6s instead of < 1.2s.
 *
 *  Solution: keep this file as an RSC that renders the <Image> (so Next.js
 *  emits the preload hint server-side), and delegate only the animated text
 *  to <HeroContent> — a minimal 'use client' boundary.
 */

import Image from 'next/image';
import type { HeroSlide } from '@/types';
import { HeroContent } from './HeroContent';

// Fallback slide — used when the API is unreachable during static build
const FALLBACK_SLIDE: HeroSlide = {
  image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=80',
  image_alt: 'Artisan handwoven baskets and ceramics arranged on a warm wooden surface',
  title: 'Where Nature\nMeets Art',
  description: "Unique handcrafted agate jewelry from the heart of Vietnam. Every piece tells a story of nature's creativity.",
  cta_text: 'Shop Now',
  cta_url: '/shop',
};

interface HeroSectionProps {
  slide?: HeroSlide;
}

export function HeroSection({ slide = FALLBACK_SLIDE }: HeroSectionProps) {
  return (
    <section
      className="relative flex min-h-[60vh] items-end overflow-hidden bg-(--color-stone) md:min-h-[60vh] xl:min-h-[80vh]"
      aria-label="Hero"
    >
      {/* Hero image — rendered in RSC so Next.js emits fetchpriority=high preload */}
      <Image
        src={slide.image_url}
        alt={slide.image_alt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Gradient overlay — ensures text legibility over any image.
          Two layers: a strong bottom-up gradient for the text area, plus a
          lighter top-down veil so the headline area is never washed-out bright. */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-(--color-stone)/90 via-(--color-stone)/50 to-(--color-stone)/10"
        aria-hidden="true"
      />

      {/* Animated headline + CTAs — minimal client boundary for Framer Motion */}
      <HeroContent
        title={slide.title}
        description={slide.description}
        ctaText={slide.cta_text}
        ctaUrl={slide.cta_url}
        cta2Text={slide.cta2_text}
        cta2Url={slide.cta2_url}
      />
    </section>
  );
}

