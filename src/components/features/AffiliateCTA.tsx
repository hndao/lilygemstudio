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
  affiliateLinkVn?: AffiliateLink;
  /** Numeric product ID — used to build the /go/{productId} redirect URL. */
  productId: string;
  productSlug: string;
  productName: string;
  /**
   * Optional price — when provided and amount === 0, the CTA label switches to
   * "Check Current Price" (amber) because the exact price is unknown or dynamic.
   */
  price?: Money;
  priceVnd?: Money;
}

export function AffiliateCTA({
  affiliateLink,
  affiliateLinkVn,
  productId,
  productSlug,
  productName,
  price,
  priceVnd,
}: AffiliateCTAProps) {
  const renderCTA = (link: AffiliateLink, prc?: Money, isVnButton = false) => {
    // If it's the VN button and the network is "direct" (common for Zalo/Local shops)
    // we use a specific label instead of "Shop on Direct".
    const rawNetwork = link.network.charAt(0).toUpperCase() + link.network.slice(1);
    const networkLabel = isVnButton && link.network === 'direct' ? 'Zalo / Website' : rawNetwork;

    const isFree = !prc || prc.amount === 0;
    
    // Zalo / VN local buttons: blue (#0068FF is Zalo brand color)
    const ctaLabel = isFree ? 'Check Current Price' : (isVnButton ? `Contact via ${networkLabel}` : `Shop on ${networkLabel}`);
    
    let bgClass = 'bg-(--color-cta) hover:bg-(--color-cta-hover)';
    if (isFree || link.network === 'amazon') {
      bgClass = 'bg-[#FF9900] hover:bg-[#E68A00]';
    } else if (isVnButton && link.network === 'direct') {
      bgClass = 'bg-[#0068FF] hover:bg-[#0054cc]';
    }

    return (
      <a
        href={isVnButton ? link.url : `/go/${productId}`}
        {...AFFILIATE_LINK_PROPS}
        onClick={() =>
          trackAffiliateClick({
            slug: productSlug,
            network: link.network,
            name: productName,
          })
        }
        className={`mt-2 flex w-full min-h-[44px] items-center justify-center gap-2 px-6 py-3.5 font-heading text-sm font-700 uppercase tracking-widest text-white transition-colors ${bgClass}`}
        aria-label={`${ctaLabel} — ${productName}`}
      >
        {ctaLabel}
        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
      </a>
    );
  };

  return (
    <>
      <div className="[.country-vn_&]:hidden block w-full">
        {renderCTA(affiliateLink, price, false)}
      </div>
      {affiliateLinkVn && (
        <div className="hidden [.country-vn_&]:block w-full">
          {renderCTA(affiliateLinkVn, priceVnd, true)}
        </div>
      )}
    </>
  );
}

