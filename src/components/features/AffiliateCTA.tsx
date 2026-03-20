'use client';

/**
 * AffiliateCTA — "Shop on X" button with dual analytics tracking.
 *
 * WHY CLIENT COMPONENT: Both Plausible (window.plausible) and Vercel Web Analytics
 * require the browser. Extracting just this button into a client component keeps the
 * entire product detail page as an RSC — only this small island is hydrated.
 *
 * MOBILE UX: min-h-[44px] meets Apple HIG / WCAG 2.5.5 minimum touch target size.
 * w-full ensures the button spans the full container on mobile for easy tapping.
 */

import { ExternalLink } from 'lucide-react';
import { trackAffiliateClick } from '@/lib/analytics';
import { AFFILIATE_LINK_PROPS } from '@/lib/ftc';
import type { AffiliateLink, Money } from '@/types';

interface AffiliateCTAProps {
  affiliateLink: AffiliateLink;
  /** Numeric product ID — used to build the /go/{productId} redirect URL. */
  productId: string;
  productSlug: string;
  productName: string;
  /**
   * Optional price — when provided and amount === 0, the CTA label switches to
   * "Check Current Price" (amber) because the exact price is unknown or dynamic.
   * Amazon prices fluctuate and a $0 value signals the importer couldn't read it.
   */
  price?: Money;
}

export function AffiliateCTA({ affiliateLink, productId, productSlug, productName, price }: AffiliateCTAProps) {
  const networkLabel =
    affiliateLink.network.charAt(0).toUpperCase() + affiliateLink.network.slice(1);

  // $0.00 or missing price → Gemini couldn't read the price. Show neutral CTA.
  const isFree = !price || price.amount === 0;
  const ctaLabel = isFree ? 'Check Current Price' : `Shop on ${networkLabel}`;

  // Amazon affiliate pages: amber (#FF9900) aligns with Amazon's own brand colour
  // and subtly signals "this goes to Amazon" — a trust cue for experienced shoppers.
  const bgClass = isFree || affiliateLink.network === 'amazon'
    ? 'bg-[#FF9900] hover:bg-[#E68A00]'
    : 'bg-(--color-cta) hover:bg-(--color-cta-hover)';

  return (
    <a
      href={`/go/${productId}`}
      {...AFFILIATE_LINK_PROPS}
      onClick={() =>
        trackAffiliateClick({
          slug: productSlug,
          network: affiliateLink.network,
          name: productName,
        })
      }
      // Sharp corners (no rounded) per "premium feel" design spec; tracking-widest for luxury feel
      className={`mt-2 flex w-full min-h-[44px] items-center justify-center gap-2 px-6 py-3.5 font-heading text-sm font-700 uppercase tracking-widest text-white transition-colors ${bgClass}`}
      aria-label={`${ctaLabel} — ${productName}`}
    >
      {ctaLabel}
      <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
    </a>
  );
}

