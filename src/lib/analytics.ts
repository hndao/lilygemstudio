/**
 * DARIIV — Analytics & Event Tracking
 *
 * DUAL TRACKING STRATEGY:
 *  1. Plausible — privacy-first, GDPR/CCPA compliant, no cookies. Primary dashboard.
 *  2. Vercel Web Analytics — built into the Vercel platform, zero-config, used for
 *     funnel analysis inside the Vercel dashboard alongside deployment data.
 *
 * WHY BOTH: Plausible is our source of truth for public-facing stats. Vercel Analytics
 * correlates conversion events with deployment performance (e.g. did a new deploy
 * improve affiliate CTR?). Both are privacy-safe — no PII, no fingerprinting.
 *
 * CUSTOM EVENTS:
 *  - Affiliate Link Click: fired when a user clicks a "Shop on X" CTA button.
 *    Props: product_slug, network (amazon|shareasale|etc), product_name.
 *    WHY: Affiliate click-through rate is the primary revenue KPI.
 *    Tracking it per-product lets us identify high-intent vs low-intent listings.
 *
 *  - Social Share: fired when a user interacts with an OG image share action.
 *    Props: page_type (product|journal|artisan), slug.
 *    WHY: Pinterest/TikTok shares are the primary organic acquisition channel.
 *    Tracking shares lets us identify which content drives the most virality.
 *
 * USAGE (client components only — both trackers require the browser):
 *   import { trackAffiliateClick } from '@/lib/analytics';
 *   <a onClick={() => trackAffiliateClick({ slug, network, name })} ... />
 */

import { track as vaTrack } from '@vercel/analytics';
import { sendGAEvent } from '@next/third-parties/google';

// ── Type declarations ─────────────────────────────────────────────────────────

// Plausible injects window.plausible — declare it to avoid TS errors
declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number | boolean> },
    ) => void;
  }
}

// ── Internal helper ───────────────────────────────────────────────────────────

/**
 * Safe wrapper around window.plausible.
 * WHY SAFE: Plausible is blocked by ad-blockers. We never want a blocked
 * analytics call to throw an error and break the user's shopping experience.
 */
function track(event: string, props?: Record<string, string | number | boolean>): void {
  try {
    window.plausible?.(event, { props });
  } catch {
    // Silently swallow — analytics must never break the UI
  }
}

// ── Public tracking functions ─────────────────────────────────────────────────

export interface AffiliateClickProps {
  /** Product slug — used to correlate clicks with product detail page views */
  slug: string;
  /** Affiliate network — lets us compare performance across networks */
  network: string;
  /** Product name — human-readable label in the Plausible dashboard */
  name: string;
}

/**
 * Track an affiliate CTA click.
 * Fires two client-side trackers — both non-blocking, both fail-safe.
 *
 * WHY ONLY TWO (not three):
 *  The DB logging now happens server-side in the /go/[productId] Route Handler,
 *  which calls GET /api/v1/redirect/{productId} before issuing the 307.
 *  This is more reliable than a fire-and-forget fetch (guaranteed to run,
 *  no risk of browser aborting the request mid-navigation) and avoids
 *  double-counting clicks in the Filament admin panel.
 */
export function trackAffiliateClick({ slug, network, name }: AffiliateClickProps): void {
  const props = { product_slug: slug, network, product_name: name };

  // 1. Plausible — privacy-first public dashboard
  track('Affiliate Link Click', props);

  // 2. Vercel Web Analytics — correlates clicks with deployment & performance data
  try {
    vaTrack('Affiliate Link Click', props);
  } catch {
    // Silently swallow — analytics must never break the UI
  }

  // 3. Google Analytics (GA4) — standardized funnel metrics
  try {
    sendGAEvent('event', 'affiliate_click', props);
  } catch {
    // Silently swallow
  }
}

export interface SocialShareProps {
  /** Page type — lets us segment shares by content type in the dashboard */
  pageType: 'product' | 'journal' | 'artisan';
  /** Slug of the shared content */
  slug: string;
}

/**
 * Track a social share interaction (OG image click, share button, etc.).
 * Call this when a user explicitly triggers a share action.
 */
export function trackSocialShare({ pageType, slug }: SocialShareProps): void {
  const props = { page_type: pageType, slug };
  
  track('Social Share', props);

  try {
    sendGAEvent('event', 'social_share', props);
  } catch {
    // Silently swallow
  }
}

