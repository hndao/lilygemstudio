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
 * WHY NO EMBLA: embla-carousel is not in the project's package.json. CSS snap
 * scroll achieves equivalent swipe UX with zero bundle cost and no hydration
 * overhead. IntersectionObserver drives dot indicators without polling.
 *
 * WHY CLIENT COMPONENT: Scroll/intersection state requires browser APIs.
 * Image data is passed as props from the RSC page — no client fetching.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { ProductImage } from '@/types';

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  // activeIndex drives desktop thumbnail highlight + desktop main image display
  const [activeIndex, setActiveIndex] = useState(0);
  // mobileIndex tracks carousel position independently via IntersectionObserver
  const [mobileIndex, setMobileIndex] = useState(0);

  const activeImage = images[activeIndex] ?? images[0];
  const thumbnails = images.slice(0, 4);
  const carouselRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver: which slide is ≥50% visible → update dot indicator
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || images.length <= 1) return;

    const slides = Array.from(carousel.children) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setMobileIndex(slides.indexOf(visible.target as HTMLElement));
      },
      { root: carousel, threshold: 0.5 },
    );

    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [images.length]);

  const scrollToSlide = useCallback((i: number) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    (carousel.children[i] as HTMLElement)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  }, []);

  return (
    <div className="flex flex-col gap-3">

      {/* ── MOBILE: CSS snap-scroll carousel ─────────────────────────────── */}
      {/* aspect-ratio box reserves space before images load → prevents CLS  */}
      <div
        ref={carouselRef}
        className={[
          'flex overflow-x-auto snap-x snap-mandatory rounded-xl',
          'scroll-smooth [-webkit-overflow-scrolling:touch]',
          // hide scrollbar cross-browser
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'md:hidden',
        ].join(' ')}
        aria-label="Product image gallery"
        role="region"
      >
        {images.map((img, i) => (
          // aspect-[1/1] reserves the space so layout doesn't shift on load
          <div key={i} className="relative aspect-square w-full shrink-0 snap-start bg-(--color-sand-light)"
            // Allow vertical scroll + pinch-to-zoom; horizontal handled by snap container
            style={{ touchAction: 'pan-y pinch-zoom' }}
          >
            <Image
              src={img.src}
              alt={img.alt || (i === 0 ? productName : `${productName}, view ${i + 1}`)}
              fill
              priority={i === 0}
              sizes="100vw"
              placeholder={img.blurDataURL ? 'blur' : 'empty'}
              blurDataURL={img.blurDataURL}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* Progress dots — mobile only */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 md:hidden" role="tablist" aria-label="Image position">
          {images.map((_, i) => (
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
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* ── DESKTOP: Static main image + thumbnail strip ──────────────────── */}
      <div className="hidden md:flex md:flex-col md:gap-3">
        {/* Main image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-(--color-sand-light)">
          <Image
            src={activeImage.src}
            alt={activeImage.alt || productName}
            fill
            priority
            sizes="(max-width: 1279px) 360px, 800px"
            placeholder={activeImage.blurDataURL ? 'blur' : 'empty'}
            blurDataURL={activeImage.blurDataURL}
            className="object-cover transition-opacity duration-300"
          />
        </div>

        {/* Thumbnail strip — tablet 3-col, desktop 4-col */}
        {thumbnails.length > 1 && (
          <div className="grid grid-cols-3 gap-2 xl:grid-cols-4">
            {thumbnails.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={[
                  'relative aspect-square overflow-hidden rounded-lg border-2 transition-colors',
                  i === activeIndex
                    ? 'border-(--color-sage)'
                    : 'border-transparent hover:border-(--color-sand-dark)',
                ].join(' ')}
                aria-label={`View image ${i + 1}`}
                aria-current={i === activeIndex}
              >
                <Image
                  src={img.src}
                  alt={img.alt || `${productName}, view ${i + 1}`}
                  fill
                  sizes="(max-width: 1279px) 80px, 120px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

