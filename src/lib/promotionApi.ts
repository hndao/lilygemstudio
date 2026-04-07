/**
 * Public promotions API — server-side only (RSC / server components).
 * Fetches active promotions and free-shipping threshold for display components.
 */

import { REVALIDATION, CACHE_TAGS } from '@/lib/cache';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';
const SITE_KEY = process.env.NEXT_PUBLIC_SITE_KEY ?? 'lilygemstudio';

export interface ActivePromotion {
  id: number;
  name: string;
  type: 'percent' | 'fixed_cents' | 'free_shipping' | 'bogo' | 'bundle' | 'tiered';
  value: number | null;
  valueCurrency: string | null;
  validUntil: string | null;
  description: string | null;
}

export interface FreeShippingThreshold {
  thresholdCents: number;
  maxOrderCents: number | null;
}

export async function getActivePromotions(): Promise<ActivePromotion[]> {
  try {
    const res = await fetch(
      `${API_BASE}/promotions/active?site=${SITE_KEY}`,
      {
        next: {
          revalidate: REVALIDATION.LISTING_LIST,
          tags: [`promotions:${SITE_KEY}`],
        },
      },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function getFreeShippingThreshold(): Promise<FreeShippingThreshold | null> {
  try {
    const res = await fetch(
      `${API_BASE}/promotions/free-shipping-threshold?site=${SITE_KEY}`,
      {
        next: {
          revalidate: REVALIDATION.LISTING_LIST,
          tags: [`promotions:${SITE_KEY}`],
        },
      },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}
