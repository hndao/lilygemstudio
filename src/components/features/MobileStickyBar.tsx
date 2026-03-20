'use client';

/**
 * MobileStickyBar — thumb-friendly persistent CTA bar for mobile product pages.
 *
 * BEHAVIOUR:
 *  - Hidden on initial load
 *  - Slides up from bottom after user scrolls past 600px (past the primary buy box)
 *  - Only renders on mobile (md:hidden in the parent, fixed positioning here)
 *
 * LAYOUT:
 *  - Left: product thumbnail (40×40) + truncated name + price
 *  - Right: full-height amber CTA button (Check Current Price / Shop on Amazon)
 *
 * GLASSMORPHISM: backdrop-blur-md + #FDF8F2/85 maintains the earthy cream aesthetic
 * while blurring content below. border-t adds subtle separation from page content.
 *
 * WHY 600px THRESHOLD: The primary "Buy Box" (AffiliateCTA) is visible until
 * ~500–600px of scroll on a typical mobile viewport. Showing the sticky bar
 * only after the user has scrolled past it avoids redundant duplication.
 *
 * TOUCH TARGETS: The CTA button spans the full right section — minimum 44px
 * height as required by WCAG 2.5.5 and Apple HIG.
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { trackAffiliateClick } from '@/lib/analytics';
import { AFFILIATE_LINK_PROPS } from '@/lib/ftc';
import type { AffiliateLink, Money, ProductImage } from '@/types';

interface MobileStickyBarProps {
  productId: string;
  productSlug: string;
  productName: string;
  price: Money;
  coverImage: ProductImage;
  affiliateLink: AffiliateLink;
  /** The ref element to scroll past before revealing the bar */
  scrollThreshold?: number;
}

export function MobileStickyBar({
  productId,
  productSlug,
  productName,
  price,
  coverImage,
  affiliateLink,
  scrollThreshold = 600,
}: MobileStickyBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > scrollThreshold);
    // passive: true — tells the browser this listener won't call preventDefault()
    // allowing it to scroll immediately without waiting for JS (performance win)
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollThreshold]);

  const networkLabel =
    affiliateLink.network.charAt(0).toUpperCase() + affiliateLink.network.slice(1);

  const isFree = price.amount === 0;
  const ctaLabel = isFree ? 'Check Current Price' : `Shop on ${networkLabel}`;

  return (
    <div
      role="complementary"
      aria-label="Quick buy bar"
      className={[
        // fixed to bottom, full-width, above content (z-50)
        'fixed bottom-0 left-0 right-0 z-50 md:hidden',
        // glassmorphism — earthy cream at 85% opacity with backdrop blur
        'border-t border-[#EAD8C0] bg-[#FDF8F2]/85 backdrop-blur-md',
        // slide-up animation
        'flex items-stretch transition-transform duration-300 ease-out',
        visible ? 'translate-y-0' : 'translate-y-full',
      ].join(' ')}
    >
      {/* Left: thumbnail + product info */}
      <div className="flex flex-1 items-center gap-3 px-4 py-3">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-(--color-sand-light)">
          <Image
            src={coverImage.src}
            alt={coverImage.alt || productName}
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-600 text-(--color-stone)">{productName}</p>
          <p className="text-xs text-(--color-sage) font-700">
            {isFree ? 'Invaluable Peace of Mind' : price.formatted}
          </p>
        </div>
      </div>

      {/* Right: full-height CTA button — amber for Amazon (#FF9900), sage for others */}
      <a
        href={`/go/${productId}`}
        {...AFFILIATE_LINK_PROPS}
        onClick={() => trackAffiliateClick({ slug: productSlug, network: affiliateLink.network, name: productName })}
        aria-label={ctaLabel}
        className={[
          // full-height tap target — meets WCAG 2.5.5 / Apple HIG 44px minimum
          'flex min-h-[60px] min-w-[140px] items-center justify-center gap-1.5',
          'px-4 font-heading text-xs font-700 uppercase tracking-widest text-white',
          'transition-opacity hover:opacity-90',
          // Amazon → amber brand colour; all others → sage-dark
          affiliateLink.network === 'amazon' ? 'bg-[#FF9900]' : 'bg-(--color-cta)',
        ].join(' ')}
      >
        {ctaLabel}
        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      </a>
    </div>
  );
}

