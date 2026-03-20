/**
 * Affiliate Redirect Route Handler — /go/[productId]
 *
 * This is the browser-facing entry point for all affiliate link clicks.
 * The button href points here instead of directly to Amazon/etc.
 *
 * FLOW:
 *  1. User clicks "Shop on Amazon" → browser opens /go/123 in new tab
 *  2. This route handler runs on Vercel Edge (server-side, fast)
 *  3. We call the Laravel API to: (a) get the affiliate URL, (b) log the click
 *  4. We return a 307 Temporary Redirect to the affiliate URL
 *  → Browser sees ONE redirect hop: Vercel → Amazon
 *
 * WHY 307 (not 302):
 *  307 preserves the HTTP method. More importantly, it signals to search engines
 *  that this redirect is temporary and should not be cached or followed for link
 *  equity. Combined with rel="nofollow" on the <a> tag, this is fully SEO-safe.
 *
 * WHY NOT 302:
 *  Some SEO crawlers treat 302 as "eventually permanent" and may cache it.
 *  307 is unambiguously temporary.
 *
 * TRACKING:
 *  - The Laravel endpoint logs the click BEFORE returning the URL.
 *  - We forward the true client IP via X-Client-IP (extracted from Vercel's
 *    X-Forwarded-For header) so the server doesn't log Vercel's datacenter IP.
 *  - We forward the X-Client-Referrer if a `ref` query param is provided
 *    (set by AffiliateCTA when the product is embedded in a journal article).
 *
 * FALLBACK:
 *  If the product doesn't exist or the API is down, we redirect to /shop
 *  rather than showing an error page — the user experience is preserved.
 *
 * CACHE:
 *  - `cache: 'no-store'` — this must never be cached (each request = one tracked click)
 */

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const FALLBACK_URL = '/shop';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
): Promise<NextResponse> {
  const { productId } = await params;

  // Validate — must be a positive integer (matches Laravel route constraint)
  if (!/^[1-9][0-9]*$/.test(productId)) {
    return NextResponse.redirect(new URL(FALLBACK_URL, request.url), { status: 307 });
  }

  if (!API_URL) {
    console.error('[/go] NEXT_PUBLIC_API_URL is not set');
    return NextResponse.redirect(new URL(FALLBACK_URL, request.url), { status: 307 });
  }

  // Extract the true client IP from Vercel's X-Forwarded-For header.
  // Vercel always sets this; the first IP in the list is the real client.
  const xForwardedFor = request.headers.get('x-forwarded-for') ?? '';
  const clientIp = xForwardedFor.split(',')[0].trim();

  // Optional referrer — journal articles can pass ?ref=/journal/slug
  const ref = request.nextUrl.searchParams.get('ref') ?? '';

  try {
    const response = await fetch(`${API_URL}/redirect/${productId}`, {
      cache: 'no-store', // never cache — every request logs one click
      headers: {
        'Accept':            'application/json',
        'X-Client-IP':       clientIp,
        'X-Client-Referrer': ref,
      },
    });

    if (!response.ok) {
      // Product not found or API error — soft fallback to shop
      return NextResponse.redirect(new URL(FALLBACK_URL, request.url), { status: 307 });
    }

    const data = (await response.json()) as { url: string; network: string };

    if (!data.url || !URL.canParse(data.url)) {
      console.error('[/go] Invalid redirect URL from API:', data.url);
      return NextResponse.redirect(new URL(FALLBACK_URL, request.url), { status: 307 });
    }

    // 307 Temporary Redirect — browser goes directly to the affiliate URL
    return NextResponse.redirect(data.url, { status: 307 });
  } catch (err) {
    console.error('[/go] API call failed:', err);
    return NextResponse.redirect(new URL(FALLBACK_URL, request.url), { status: 307 });
  }
}

