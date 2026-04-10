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
 *  Solution: keep this file as an RSC that renders the first slide <Image> (so
 *  Next.js emits the preload hint server-side), and delegate animated text to
 *  <HeroContent> (single mode) or <HeroCarousel> (slider mode).
 */

import Image from 'next/image';
import type { HeroSlide } from '@/types';
import { HeroContent } from './HeroContent';
import { HeroCarousel } from './HeroCarousel';

// Fallback slide — used when the API is unreachable during static build
const FALLBACK_SLIDE: HeroSlide = {
  image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=80',
  image_alt: 'Artisan handwoven baskets and ceramics arranged on a warm wooden surface',
  title_en: 'Where Nature\nMeets Art',
  title_vi: 'Nơi Thiên Nhiên\nGặp Nghệ Thuật',
  description_en: "Unique handcrafted agate jewelry from the heart of Vietnam. Every piece tells a story of nature's creativity.",
  description_vi: 'Trang sức mã não thủ công độc đáo từ trái tim Việt Nam. Mỗi tác phẩm kể một câu chuyện về sự sáng tạo của thiên nhiên.',
  cta_text_en: 'Shop Now',
  cta_text_vi: 'Mua Ngay',
  cta_url: '/shop',
};

/** Resolve bilingual text: key_lang → key_en → legacy key → '' */
function slideText(
  slide: HeroSlide,
  key: 'title' | 'description' | 'cta_text' | 'cta2_text',
  lang: string,
): string {
  const s = slide as unknown as Record<string, unknown>;
  const str = (k: string) => { const v = s[k]; return typeof v === 'string' && v.trim() ? v : ''; };
  return str(`${key}_${lang}`) || str(`${key}_en`) || str(key);
}

interface HeroSectionProps {
  slides?: HeroSlide[];
  heroMode?: 'single' | 'slider';
  lang?: string;
}

export function HeroSection({ slides = [FALLBACK_SLIDE], heroMode = 'single', lang = 'en' }: HeroSectionProps) {
  const firstSlide = slides[0] ?? FALLBACK_SLIDE;
  const isSlider = heroMode === 'slider' && slides.length > 1;

  return (
    <section
      className="relative flex min-h-[60vh] items-end overflow-hidden bg-(--color-stone) md:min-h-[60vh] xl:min-h-[80vh]"
      aria-label="Hero"
    >
      {/* First slide image — rendered in RSC so Next.js emits fetchpriority=high preload hint.
          In slider mode this is the SSR base; HeroCarousel renders images on top after hydration. */}
      <Image
        src={firstSlide.image_url}
        alt={firstSlide.image_alt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Gradient overlay — visible in SSR before client components hydrate */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-(--color-stone)/90 via-(--color-stone)/50 to-(--color-stone)/10"
        aria-hidden="true"
      />

      {isSlider ? (
        /* Full-overlay carousel — renders its own images, gradient, text, and controls */
        <HeroCarousel slides={slides} lang={lang} />
      ) : (
        /* Single mode — animated headline + CTAs */
        <HeroContent
          title={slideText(firstSlide, 'title', lang)}
          description={slideText(firstSlide, 'description', lang)}
          ctaText={slideText(firstSlide, 'cta_text', lang)}
          ctaUrl={firstSlide.cta_url}
          cta2Text={slideText(firstSlide, 'cta2_text', lang) || undefined}
          cta2Url={firstSlide.cta2_url}
        />
      )}
    </section>
  );
}
