'use client';

/**
 * HeroCarousel — client-side carousel for the hero section.
 *
 * Used by HeroSection when hero_mode === 'slider' and there are ≥ 2 slides.
 * Features:
 *  - Crossfade background image transition (Framer Motion AnimatePresence)
 *  - Slide-up/down text transition per slide change
 *  - Auto-advance every 5s, resets on manual navigation
 *  - Prev / Next arrow buttons (sides)
 *  - Dot indicators (bottom-center)
 *  - Pause on hover
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { HeroSlide } from '@/types';
import { HeroContent } from './HeroContent';

const AUTO_ADVANCE_MS = 5000;
const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

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

interface HeroCarouselProps {
  slides: HeroSlide[];
  lang: string;
}

const SWIPE_THRESHOLD = 50; // px — minimum horizontal distance to count as a swipe

export function HeroCarousel({ slides, lang }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number | null>(null);

  const advance = useCallback(
    (dir: 1 | -1) => {
      setCurrent(prev => (prev + dir + slides.length) % slides.length);
    },
    [slides.length],
  );

  const goTo = useCallback((index: number) => {
    setCurrent(index);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      advance(delta > 0 ? 1 : -1);
    }
    touchStartX.current = null;
  }, [advance]);

  // Auto-advance — resets whenever current or paused changes
  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(() => advance(1), AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current, paused, advance]);

  const slide = slides[current];
  const title       = slideText(slide, 'title',       lang);
  const description = slideText(slide, 'description', lang);
  const ctaText     = slideText(slide, 'cta_text',    lang);
  const cta2Text    = slideText(slide, 'cta2_text',   lang) || undefined;

  return (
    /* Absolute overlay — covers the RSC base image and gradient from HeroSection */
    <div
      className="absolute inset-0 flex items-end"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Background images (crossfade) ─────────────────────────────── */}
      <AnimatePresence initial={false}>
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
        >
          <Image
            src={slide.image_url}
            alt={slide.image_alt}
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
        </motion.div>
      </AnimatePresence>

      {/* ── Gradient overlay ──────────────────────────────────────────── */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-(--color-stone)/90 via-(--color-stone)/50 to-(--color-stone)/10"
        aria-hidden="true"
      />

      {/* ── Slide content (text + CTAs) ───────────────────────────────── */}
      <div className="relative z-10 w-full">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`content-${current}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <HeroContent
              title={title}
              description={description}
              ctaText={ctaText}
              ctaUrl={slide.cta_url}
              cta2Text={cta2Text}
              cta2Url={slide.cta2_url}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Prev / Next arrows — desktop only; mobile uses swipe ─────── */}
      <button
        onClick={() => advance(-1)}
        className="absolute left-5 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-(--color-stone)/50 text-(--color-cream) transition-colors hover:bg-(--color-stone)/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-cream) md:flex"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>

      <button
        onClick={() => advance(1)}
        className="absolute right-5 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-(--color-stone)/50 text-(--color-cream) transition-colors hover:bg-(--color-stone)/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-cream) md:flex"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* ── Dot indicators ────────────────────────────────────────────── */}
      <div
        className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2"
        role="tablist"
        aria-label="Slide indicators"
      >
        {slides.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === current}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i)}
            className={[
              'h-2 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-(--color-cream)',
              i === current
                ? 'w-6 bg-(--color-cream)'
                : 'w-2 bg-(--color-cream)/50 hover:bg-(--color-cream)/80',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  );
}
