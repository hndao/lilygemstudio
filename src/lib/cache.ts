/**
 * DARIIV — Cache Strategy Layer
 *
 * WHY CENTRALISED TTLs: Scattering `revalidate: 3600` magic numbers across
 * components makes cache tuning a grep exercise. One constant here = one PR to
 * change freshness policy for the entire site.
 *
 * STRATEGY RATIONALE:
 *  - Products list (24h): Pinterest/TikTok traffic arrives in spikes — the grid
 *    must survive a surge without hammering the DB. Prices are refreshed via a
 *    background job (Phase 2), not on every page request.
 *  - Product detail (1h): Affiliate price changes need to surface faster than the
 *    grid. 1h is a balance between freshness and CDN hit rate.
 *  - Reviews (7d): Review content is near-static. Long TTL = near-zero DB load
 *    for the most expensive join (products → reviews → review_images).
 *  - false = no ISR, always fresh (used for auth-gated, user-specific pages).
 */

// ── Revalidation TTLs (seconds) ───────────────────────────────────────────────

export const REVALIDATION = {
  /** Catalog grid — survives traffic spikes, refreshed by background price job */
  PRODUCT_LIST: 60 * 60 * 24,   // 24h

  /** Single product page — affiliate price freshness is more critical here */
  PRODUCT_DETAIL: 60 * 60,      // 1h

  /** Reviews — near-static content, long TTL reduces DB join pressure */
  REVIEWS: 60 * 60 * 24 * 7,   // 7 days

  /** Category metadata — changes only when admin updates taxonomy */
  CATEGORIES: 60 * 60 * 24,    // 24h

  /** Artisan list — profiles change infrequently; 3d TTL reduces DB load */
  ARTISANS: 60 * 60 * 24 * 3,  // 3 days

  /** Journal articles — content is editorial; 6h balances freshness vs CDN hit rate */
  JOURNAL: 60 * 60 * 6,        // 6h

  /** No ISR — user-specific or real-time pages */
  NONE: false as const,

  /**
   * Site settings — hero content, social links, metadata.
   * Matches the 24h Laravel cache TTL in SiteSetting::allGrouped().
   * Busted via revalidateTag(CACHE_TAGS.SETTINGS) when admin saves.
   */
  SETTINGS: 60 * 60 * 24,         // 24h
} as const;

// ── Cache tag helpers ─────────────────────────────────────────────────────────
//
// WHY TAGS: Next.js `revalidateTag()` lets us surgically invalidate cache
// entries from the Laravel webhook (e.g., price update job calls
// POST /api/revalidate?tag=product:handwoven-basket) without a full ISR purge.

export const CACHE_TAGS = {
  /** Broad tag — invalidates ALL product-related cache (use sparingly) */
  PRODUCTS: 'products',

  /** Narrow tag — invalidates one product's detail page only */
  product: (slug: string) => `product:${slug}`,

  /** Reviews for a specific product */
  reviews: (productSlug: string) => `reviews:${productSlug}`,

  /** All products in a category */
  category: (slug: string) => `category:${slug}`,

  /** Broad tag — invalidates the full category list */
  CATEGORIES: 'categories',

  /** Broad tag — invalidates all artisan-related cache */
  ARTISANS: 'artisans',

  /** Narrow tag — invalidates one artisan's profile page */
  artisan: (slug: string) => `artisan:${slug}`,

  /** Broad tag — invalidates all journal posts */
  JOURNAL: 'journal',

  /** Narrow tag — invalidates one journal article */
  post: (slug: string) => `post:${slug}`,

  /** Site-wide settings — hero, social links, metadata */
  SETTINGS: 'settings',
} as const;

// ── unstable_cache wrappers ───────────────────────────────────────────────────
//
// WHY unstable_cache: For server-side computations that aren't plain fetches
// (e.g., aggregating price ranges, computing category facets), we wrap with
// unstable_cache so they benefit from the same ISR/tag invalidation as fetches.
// The "unstable" prefix is Next.js naming — it is production-safe as of Next 14+.

import { unstable_cache } from 'next/cache';
import type { ProductListParams } from '@/types';

type CacheFn<TArgs extends unknown[], TReturn> = (...args: TArgs) => Promise<TReturn>;

/**
 * Wraps an async server function with Next.js data cache + tag invalidation.
 *
 * Usage:
 *   export const getCachedProducts = withCache(
 *     getProducts,
 *     (params) => ['products', JSON.stringify(params)],
 *     { revalidate: REVALIDATION.PRODUCT_LIST, tags: [CACHE_TAGS.PRODUCTS] }
 *   );
 */
export function withCache<TArgs extends unknown[], TReturn>(
  fn: CacheFn<TArgs, TReturn>,
  keyFn: (...args: TArgs) => string[],
  opts: { revalidate: number | false; tags?: string[] },
): CacheFn<TArgs, TReturn> {
  return (...args: TArgs) =>
    unstable_cache(
      () => fn(...args),
      keyFn(...args),
      { revalidate: opts.revalidate === false ? undefined : opts.revalidate, tags: opts.tags },
    )();
}

// ── On-demand revalidation helper ────────────────────────────────────────────
//
// Called from the /api/revalidate route handler when the Laravel price-update
// job triggers a webhook. Invalidates only the affected product's cache entries.

import { revalidateTag } from 'next/cache';

export function invalidateProduct(slug: string): void {
  // WHY 'default': Next.js 16 revalidateTag requires a cache profile name.
  // 'default' targets standard ISR fetch caches — not scoped to use-cache profiles.
  revalidateTag(CACHE_TAGS.product(slug), 'default');
  revalidateTag(CACHE_TAGS.reviews(slug), 'default');
}

export function invalidateAllProducts(): void {
  revalidateTag(CACHE_TAGS.PRODUCTS, 'default');
}

// ── Type re-exports used by api.ts ────────────────────────────────────────────
// (keeps api.ts import list clean — single internal import from @/lib/cache)
export type { ProductListParams };

