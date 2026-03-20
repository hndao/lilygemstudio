/**
 * ISR On-Demand Revalidation Webhook — POST /api/revalidate
 *
 * WHY THIS EXISTS: Next.js ISR caches pages for up to 24h. When the Laravel
 * TrackPriceHistory job detects a price change, it calls this endpoint to
 * surgically invalidate only the affected product's cache — without waiting
 * for the TTL to expire. This keeps affiliate prices accurate without
 * hammering the DB on every page request.
 *
 * SECURITY MODEL:
 *  - Bearer token in Authorization header (REVALIDATE_SECRET env var)
 *  - Constant-time comparison via timingSafeEqual to prevent timing attacks
 *  - Only POST method accepted — GET would allow CSRF via <img> tags
 *
 * CALLED BY: dariiv-api TrackPriceHistory job (Phase 2)
 *   POST https://dariiv.com/api/revalidate
 *   Authorization: Bearer <REVALIDATE_SECRET>
 *   Content-Type: application/json
 *   Body: { "tag": "product:handwoven-basket" }
 *         { "tag": "products" }          ← broad invalidation (use sparingly)
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { timingSafeEqual, createHash } from 'crypto';

// WHY maxDuration: Revalidation may fan out to several cache tags in sequence.
// 10s gives enough headroom without hitting Vercel's serverless default (which
// can be as low as 5s on Hobby). Previously configured in vercel.json — moved
// here since App Router functions must declare this in the route segment config.
export const maxDuration = 10;

// ── Secret validation ─────────────────────────────────────────────────────────

function isValidSecret(provided: string): boolean {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) {
    // WHY: fail closed — if the secret isn't configured, reject all requests.
    // This prevents accidental open revalidation endpoints in staging.
    console.error('[revalidate] REVALIDATE_SECRET env var is not set');
    return false;
  }

  // WHY timingSafeEqual: naive string comparison (===) leaks timing information
  // that allows an attacker to brute-force the secret one character at a time.
  // timingSafeEqual always takes the same time regardless of where strings differ.
  const providedBuf = createHash('sha256').update(provided).digest();
  const expectedBuf = createHash('sha256').update(expected).digest();
  return timingSafeEqual(providedBuf, expectedBuf);
}

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Authenticate
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!isValidSecret(token)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    );
  }

  // 2. Parse body
  let body: { tag?: string; tags?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  // 3. Collect tags to invalidate
  // WHY support both `tag` (single) and `tags` (batch): the Laravel job sends
  // a single tag per price update, but a bulk import command may send many.
  const tags: string[] = [];
  if (body.tag)  tags.push(body.tag);
  if (body.tags) tags.push(...body.tags);

  if (tags.length === 0) {
    return NextResponse.json(
      { error: 'Provide at least one tag in body: { tag: string } or { tags: string[] }' },
      { status: 400 },
    );
  }

  // 4. Revalidate
  // WHY 'default': Next.js 16 revalidateTag requires a cache profile name.
  // 'default' targets standard ISR fetch caches — not scoped to use-cache profiles.
  const revalidated: string[] = [];
  for (const tag of tags) {
    revalidateTag(tag, 'default');
    revalidated.push(tag);
    console.log(`[revalidate] purged tag: ${tag}`);
  }

  return NextResponse.json(
    { revalidated, timestamp: new Date().toISOString() },
    { status: 200 },
  );
}

// Reject all other HTTP methods — GET would allow CSRF via browser navigation
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

