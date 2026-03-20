/**
 * AffiliateDisclosure — FTC-required disclosure for all affiliate links.
 *
 * WHY THIS EXISTS: The FTC requires clear and conspicuous disclosure whenever
 * a site earns commission from affiliate links. This component is the single
 * enforcement point — every affiliate CTA must render this alongside it.
 * Centralising it here means a legal copy update touches ONE file, not every
 * product page.
 *
 * PLACEMENT RULES (from wireframes):
 *  - Product Detail: inline, directly below the CTA button
 *  - Footer: always visible, compact variant
 */

import { AlertCircle } from 'lucide-react';
import { FTC_DISCLOSURE_TEXT, getNetworkDisclosureText } from '@/lib/ftc';
import type { AffiliateLink } from '@/types';

interface AffiliateDisclosureProps {
  /** 'inline' = below CTA on product pages. 'footer' = compact footer strip. */
  variant?: 'inline' | 'footer';
  /**
   * Affiliate network — when provided, shows the legally required network-specific
   * text (e.g. Amazon requires the exact phrase "As an Amazon Associate, I earn
   * from qualifying purchases." per their Operating Agreement §5).
   */
  network?: AffiliateLink['network'];
  className?: string;
}

export function AffiliateDisclosure({
  variant = 'inline',
  network,
  className = '',
}: AffiliateDisclosureProps) {
  const text = network ? getNetworkDisclosureText(network) : FTC_DISCLOSURE_TEXT;

  if (variant === 'footer') {
    return (
      <p className={`text-xs text-(--color-muted) ${className}`}>
        <span className="font-medium">Affiliate Disclosure:</span>{' '}
        {text}
      </p>
    );
  }

  // Inline variant — always rendered directly below the CTA button on product pages
  return (
    <div
      className={`flex items-center gap-1.5 ${className}`}
      role="note"
      aria-label="Affiliate disclosure"
    >
      <AlertCircle
        className="h-3 w-3 shrink-0 text-(--color-muted)"
        aria-hidden="true"
      />
      <p className="text-xs text-(--color-muted)">{text}</p>
    </div>
  );
}

