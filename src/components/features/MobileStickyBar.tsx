'use client';

/**
 * MobileStickyBar — thumb-friendly persistent CTA bar for mobile product pages.
 *
 * BEHAVIOUR:
 *  - Hidden on initial load
 *  - Slides up from bottom after user scrolls past 600px (past the primary buy box)
 *  - Only renders on mobile (md:hidden)
 *
 * VN LAYOUT (from mockup Section 04):
 *  ┌─────────────────────────────────────────┐
 *  │  ♡ (48px)  │  💬 (48px)  │  🛒 Thêm vào giỏ (flex-1)  │
 *  └─────────────────────────────────────────┘
 *
 * GLOBAL LAYOUT (unchanged):
 *  - Left: product thumbnail + truncated name + price
 *  - Right: full-height "Shop on Etsy" button
 *
 * SPECS: Height 72px, bg #FFFDF9, border-top 1px #E8E2DA, gap 10px,
 *        safe-area-inset-bottom for iPhone notch.
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Heart, ShoppingCart, ExternalLink } from 'lucide-react';
import { trackAffiliateClick } from '@/lib/analytics';
import { AFFILIATE_LINK_PROPS } from '@/lib/ftc';
import { MobileCartSheet } from '@/components/features/MobileCartSheet';
import type { Dictionary } from '@/lib/i18n';
import type { AffiliateLink, ColorOption, Money, ProductImage } from '@/types';

interface MobileStickyBarProps {
  productId: string;
  productSlug: string;
  productName: string;
  price: Money;
  priceVnd?: Money;
  coverImage: ProductImage;
  affiliateLink: AffiliateLink;
  zaloUrl?: string;
  /** Color options for the mobile cart sheet — from above_cart color field */
  colorOptions?: ColorOption[];
  stockQuantity?: number | null;
  scrollThreshold?: number;
  dict: Dictionary['buybox'];
}

export function MobileStickyBar({
  productId,
  productSlug,
  productName,
  price,
  priceVnd,
  coverImage,
  affiliateLink,
  zaloUrl,
  colorOptions,
  stockQuantity,
  scrollThreshold = 600,
  dict,
}: MobileStickyBarProps) {
  const [visible, setVisible] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > scrollThreshold);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollThreshold]);

  const zaloHref = zaloUrl ?? '#';

  /* ── Global layout (Shop on Etsy) ─────────────────────────────────── */
  const renderGlobalBar = () => {
    const rawNetwork = affiliateLink.network.charAt(0).toUpperCase() + affiliateLink.network.slice(1);
    const isFree = price.amount === 0;
    const ctaLabel = isFree ? 'Check Current Price' : `Shop on ${rawNetwork}`;

    return (
      <div className="flex w-full items-center">
        <div className="flex flex-1 items-center gap-3 px-4 py-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-(--color-quartz-mist)">
            <Image src={coverImage.src} alt={coverImage.alt || productName} fill sizes="40px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-600 text-(--color-stone)">{productName}</p>
            <p className="text-xs font-700 text-(--color-cta)">
              {isFree ? 'Invaluable Peace of Mind' : price.formatted}
            </p>
          </div>
        </div>
        <a
          href={`/go/${productId}`}
          {...AFFILIATE_LINK_PROPS}
          onClick={() => trackAffiliateClick({ slug: productSlug, network: affiliateLink.network, name: productName })}
          aria-label={ctaLabel}
          className="flex min-h-[60px] min-w-[140px] items-center justify-center gap-1.5 bg-(--color-cta) px-4 font-heading text-xs font-700 uppercase tracking-widest text-white transition-opacity hover:opacity-90"
        >
          {ctaLabel}
          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </a>
      </div>
    );
  };

  /* ── VN layout (♡ | 💬 | 🛒) ──────────────────────────────────────── */
  const renderVnBar = () => (
    <>
      <div className="flex w-full items-center gap-2.5 px-4 py-3">
        {/* Wishlist icon */}
        <button
          type="button"
          onClick={() => setWishlisted((prev) => !prev)}
          className={[
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border-[1.5px] transition-all',
            wishlisted
              ? 'border-(--color-promo) bg-(--color-promo)/10'
              : 'border-(--color-border) hover:bg-(--color-quartz-mist)',
          ].join(' ')}
          aria-label={wishlisted ? dict.wishlist_remove : dict.wishlist_add}
        >
          <Heart
            className={`h-5 w-5 text-(--color-promo) ${wishlisted ? 'fill-(--color-promo)' : ''}`}
            aria-hidden="true"
          />
        </button>

        {/* Zalo icon */}
        <a
          href={zaloHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border-[1.5px] border-(--color-border) transition-all hover:bg-(--color-quartz-mist)"
          aria-label="Zalo"
        >
          <Image src="/logo-zalo.webp" alt="Zalo" width={20} height={20} className="shrink-0" />
        </a>

        {/* Add to Cart — primary, fills remaining space */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[12px] bg-(--color-cta) text-[15px] font-600 text-(--color-cream) transition-all hover:bg-(--color-cta-hover)"
          aria-label={dict.add_to_cart}
        >
          <ShoppingCart className="h-[18px] w-[18px]" aria-hidden="true" />
          {dict.add_to_cart_short}
        </button>
      </div>

      {/* Bottom sheet for size/qty selection */}
      <MobileCartSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        productId={productId}
        productSlug={productSlug}
        productName={productName}
        price={priceVnd ?? price}
        coverImage={coverImage.src}
        colorOptions={colorOptions}
        stockQuantity={stockQuantity}
        dict={dict}
      />
    </>
  );

  return (
    <div
      role="complementary"
      aria-label="Quick buy bar"
      className={[
        'fixed bottom-0 left-0 right-0 z-[100] md:hidden',
        'border-t border-(--color-border) bg-(--color-surface)',
        'pb-[env(safe-area-inset-bottom)]',
        'transition-transform duration-300 ease-out',
        visible ? 'translate-y-0' : 'translate-y-full',
      ].join(' ')}
    >
      {/* Global bar — hidden when VN */}
      <div className="geo-hide-vn w-full">
        {renderGlobalBar()}
      </div>

      {/* VN bar — hidden by default, shown for VN users */}
      {zaloUrl && (
        <div className="geo-show-vn w-full">
          {renderVnBar()}
        </div>
      )}
    </div>
  );
}
