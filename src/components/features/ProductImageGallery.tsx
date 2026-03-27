'use client';

/**
 * ProductImageGallery — swipe carousel on mobile, thumbnail grid on desktop.
 *
 * BREAKPOINT BEHAVIOUR:
 *  - Mobile:  CSS scroll-snap horizontal carousel + progress dot indicators.
 *             touch-action:pan-y preserves vertical page scroll while allowing
 *             horizontal swipe between images. Pinch-to-zoom works natively via
 *             touch-action:pinch-zoom on the image itself (no JS needed).
 *  - Tablet:  main image (~360px) + 3 thumbnails below (unchanged)
 *  - Desktop: main image (800×800) + 4 thumbnails below (unchanged)
 *
 * VIDEO SUPPORT: When videoUrl is provided it becomes slide 0 (first in carousel,
 * first thumbnail). The <video> element uses preload="none" + poster={coverImage}
 * so it has zero LCP impact — the browser only downloads the video on play.
 *
 * WHY NO EMBLA: embla-carousel is not in the project's package.json. CSS snap
 * scroll achieves equivalent swipe UX with zero bundle cost and no hydration
 * overhead. IntersectionObserver drives dot indicators without polling.
 *
 * WHY CLIENT COMPONENT: Scroll/intersection state requires browser APIs.
 * Image data is passed as props from the RSC page — no client fetching.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useProductColor } from '@/context/ProductColorContext';
import type { ProductImage } from '@/types';

// ── Media slide types ──────────────────────────────────────────────────────────

type VideoSlide = { type: 'video'; url: string; poster: string };
type ImageSlide = { type: 'image'; image: ProductImage };
type MediaSlide = VideoSlide | ImageSlide;

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
  videoUrl?: string;
}

export function ProductImageGallery({ images, productName, videoUrl }: ProductImageGalleryProps) {
  // Build unified slide list: video first (when present), then images
  const slides: MediaSlide[] = [
    ...(videoUrl
      ? [{ type: 'video' as const, url: videoUrl, poster: images[0]?.src ?? '' }]
      : []),
    ...images.map((image): ImageSlide => ({ type: 'image', image })),
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);

  const activeSlide = slides[activeIndex] ?? slides[0];
  const thumbnails = slides.slice(0, 4);
  const carouselRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver: which slide is ≥50% visible → update dot indicator
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || slides.length <= 1) return;

    const children = Array.from(carousel.children) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setMobileIndex(children.indexOf(visible.target as HTMLElement));
      },
      { root: carousel, threshold: 0.5 },
    );

    children.forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [slides.length]);

  const scrollToSlide = useCallback((i: number) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    (carousel.children[i] as HTMLElement)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  }, []);

  // Jump to first image matching the active color tag when selection changes
  const { activeTag } = useProductColor();
  useEffect(() => {
    if (!activeTag) return;
    const matchIndex = slides.findIndex(
      (s) => s.type === 'image' && s.image.tag === activeTag,
    );
    if (matchIndex >= 0) {
      setActiveIndex(matchIndex);
      scrollToSlide(matchIndex);
    }
  }, [activeTag, slides, scrollToSlide]);

  return (
    <div className="flex flex-col gap-3">

      {/* ── MOBILE: CSS snap-scroll carousel ─────────────────────────────── */}
      <div
        ref={carouselRef}
        className={[
          'flex overflow-x-auto snap-x snap-mandatory rounded-xl',
          'scroll-smooth [-webkit-overflow-scrolling:touch]',
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'md:hidden',
        ].join(' ')}
        aria-label="Product media gallery"
        role="region"
      >
        {slides.map((slide, i) =>
          slide.type === 'video' ? (
            // Video slide — preload="none" + poster prevents LCP degradation
            <div key="video" className="relative aspect-square w-full shrink-0 snap-start bg-black">
              <video
                src={slide.url}
                poster={slide.poster}
                preload="none"
                muted
                playsInline
                controls
                className="h-full w-full object-contain"
                aria-label={`${productName} — product video`}
              />
            </div>
          ) : (
            <div
              key={i}
              className="relative aspect-square w-full shrink-0 snap-start bg-(--color-sand-light)"
              style={{ touchAction: 'pan-y pinch-zoom' }}
            >
              <Image
                src={slide.image.src}
                alt={slide.image.alt || (i === 0 ? productName : `${productName}, view ${i + 1}`)}
                fill
                priority={i === 0 && !videoUrl}
                sizes="100vw"
                placeholder={slide.image.blurDataURL ? 'blur' : 'empty'}
                blurDataURL={slide.image.blurDataURL}
                className="object-cover"
              />
            </div>
          )
        )}
      </div>

      {/* Progress dots — mobile only */}
      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5 md:hidden" role="tablist" aria-label="Media position">
          {slides.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === mobileIndex}
              onClick={() => scrollToSlide(i)}
              className={[
                'h-1.5 rounded-full transition-all duration-200',
                i === mobileIndex
                  ? 'w-4 bg-(--color-sage)'
                  : 'w-1.5 bg-(--color-sand-dark)',
              ].join(' ')}
              aria-label={i === 0 && videoUrl ? 'Play video' : `Go to image ${videoUrl ? i : i + 1}`}
            />
          ))}
        </div>
      )}

      {/* ── DESKTOP: Static main view + thumbnail strip ────────────────────── */}
      <div className="hidden md:flex md:flex-col md:gap-3">
        {/* Main viewer */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-(--color-sand-light)">
          {activeSlide.type === 'video' ? (
            <video
              src={activeSlide.url}
              poster={activeSlide.poster}
              preload="none"
              muted
              playsInline
              controls
              className="h-full w-full object-contain bg-black"
              aria-label={`${productName} — product video`}
            />
          ) : (
            <Image
              src={activeSlide.image.src}
              alt={activeSlide.image.alt || productName}
              fill
              priority
              sizes="(max-width: 1279px) 360px, 800px"
              placeholder={activeSlide.image.blurDataURL ? 'blur' : 'empty'}
              blurDataURL={activeSlide.image.blurDataURL}
              className="object-cover transition-opacity duration-300"
            />
          )}
        </div>

        {/* Thumbnail strip — tablet 3-col, desktop 4-col */}
        {thumbnails.length > 1 && (
          <div className="grid grid-cols-3 gap-2 xl:grid-cols-4">
            {thumbnails.map((slide, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={[
                  'relative aspect-square overflow-hidden rounded-lg border-2 transition-colors',
                  i === activeIndex
                    ? 'border-(--color-sage)'
                    : 'border-transparent hover:border-(--color-sand-dark)',
                ].join(' ')}
                aria-label={slide.type === 'video' ? 'Play video' : `View image ${i + 1}`}
                aria-current={i === activeIndex}
              >
                {slide.type === 'video' ? (
                  // Video thumbnail: poster image + play icon overlay
                  <>
                    {slide.poster && (
                      <Image src={slide.poster} alt="Video thumbnail" fill sizes="120px" className="object-cover" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <svg className="h-6 w-6 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </>
                ) : (
                  <Image
                    src={slide.image.src}
                    alt={slide.image.alt || `${productName}, view ${i + 1}`}
                    fill
                    sizes="(max-width: 1279px) 80px, 120px"
                    className="object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
