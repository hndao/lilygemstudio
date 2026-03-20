'use client';

/**
 * AffiliateProductBlock — self-contained embeddable product + affiliate CTA block.
 *
 * USE CASES:
 *  - Inline product recommendations inside Journal articles
 *  - Sidebar product spotlights
 *  - Any context where you need a complete product card without the full product
 *    detail page (image + name + price + "Shop on X" button + FTC disclosure).
 *
 * WHY CLIENT COMPONENT: trackAffiliateClick fires window.plausible and Vercel
 * Web Analytics — both require the browser. This is the minimal client island.
 *
 * FTC COMPLIANCE:
 *  - Network-specific disclosure text rendered directly below the CTA button.
 *  - Amazon: exact wording "As an Amazon Associate, I earn from qualifying
 *    purchases." as required by Amazon Associates Operating Agreement §5.
 *  - All affiliate links include rel="nofollow noopener noreferrer sponsored"
 *    and target="_blank" via AFFILIATE_LINK_PROPS.
 *
 * MOBILE UX:
 *  - Button is w-full and min-h-[44px] — meets Apple HIG / WCAG 2.5.5 minimum
 *    touch target size of 44×44 CSS px.
 */

import Image from 'next/image';
import { ExternalLink, AlertCircle } from 'lucide-react';
import { trackAffiliateClick } from '@/lib/analytics';
import { AFFILIATE_LINK_PROPS, getNetworkDisclosureText } from '@/lib/ftc';
import type { AffiliateLink, ProductImage } from '@/types';

export interface AffiliateProductBlockProps {
  /** Product thumbnail — provide width/height for layout stability (no CLS). */
  image: Pick<ProductImage, 'src' | 'alt' | 'width' | 'height'>;
  productName: string;
  /** Numeric product ID — used to build the /go/{productId} redirect URL. */
  productId: string;
  /** Slug used to correlate analytics events with the product detail page. */
  productSlug: string;
  /** Pre-formatted price string from the API (e.g. "$49.99"). Optional. */
  price?: string;
  /** Affiliate network — determines the button label and FTC disclosure text. */
  network: AffiliateLink['network'];
  className?: string;
}

export function AffiliateProductBlock({
  image,
  productName,
  productId,
  productSlug,
  price,
  network,
  className = '',
}: AffiliateProductBlockProps) {
  const networkLabel = network.charAt(0).toUpperCase() + network.slice(1);
  const disclosureText = getNetworkDisclosureText(network);

  return (
    <div
      className={`flex gap-4 rounded-xl border border-(--color-sand) bg-(--color-cream) p-4 shadow-(--shadow-soft) ${className}`}
    >
      {/* Product image */}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>

      {/* Info + CTA */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="line-clamp-2 font-heading font-semibold leading-snug text-(--color-stone)">
          {productName}
        </p>

        {price && (
          <p className="text-sm font-700 text-(--color-cta)">{price}</p>
        )}

        {/* CTA button — w-full + min-h-[44px] for finger-friendly mobile tap target */}
        <a
          href={`/go/${productId}`}
          {...AFFILIATE_LINK_PROPS}
          onClick={() =>
            trackAffiliateClick({
              slug: productSlug,
              network,
              name: productName,
            })
          }
          aria-label={`Shop ${productName} on ${networkLabel}`}
          className="mt-1 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-md bg-(--color-cta) px-4 py-2.5 font-heading text-sm font-700 text-white transition-colors hover:bg-(--color-cta-hover)"
        >
          Shop on {networkLabel}
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
        </a>

        {/* FTC disclosure — network-specific, always rendered below CTA */}
        <div
          className="flex items-start gap-1.5"
          role="note"
          aria-label="Affiliate disclosure"
        >
          <AlertCircle
            className="mt-0.5 h-3 w-3 shrink-0 text-(--color-muted)"
            aria-hidden="true"
          />
          <p className="text-xs text-(--color-muted)">{disclosureText}</p>
        </div>
      </div>
    </div>
  );
}

