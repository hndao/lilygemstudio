/**
 * Generic Site OG Image — GET /api/og
 *
 * WHY DYNAMIC OG IMAGES: Static OG images are shared across all pages and
 * become stale. Dynamic ImageResponse generates a branded 1200×630 image
 * at request time, cached at the CDN edge for 1h (see next.config.ts headers).
 *
 * USED BY:
 *  - Homepage (/) — websiteJsonLd + generateCatalogMeta fallback
 *  - Catalog (/shop) — generateCatalogMeta
 *  - Any page without a product-specific OG image
 *
 * DESIGN: Stone (#2D3436) background, sage (#76885B) accent stripe,
 * DARIIV wordmark in sand (#EAD8C0), tagline in muted cream.
 * 1200×630 = Pinterest/TikTok/Twitter optimal ratio.
 */

import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

// WHY edge runtime: ImageResponse uses the Vercel Edge Runtime's Canvas API.
// Node.js runtime would require a native canvas dependency — edge is zero-config.

export async function GET(req: NextRequest): Promise<ImageResponse> {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') ?? 'Artisan Goods, Curated for You';
  const subtitle = searchParams.get('subtitle') ?? 'Handpicked products with verified reviews';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#2D3436',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Sage accent stripe — top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            backgroundColor: '#76885B',
          }}
        />

        {/* Decorative circle — bottom right */}
        <div
          style={{
            position: 'absolute',
            bottom: '-120px',
            right: '-120px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            backgroundColor: '#76885B',
            opacity: 0.12,
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '80px 96px',
            flex: 1,
          }}
        >
          {/* Wordmark */}
          <div
            style={{
              fontSize: '28px',
              fontWeight: 700,
              letterSpacing: '0.3em',
              color: '#76885B',
              textTransform: 'uppercase',
              marginBottom: '40px',
            }}
          >
            DARIIV
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: '64px',
              fontWeight: 700,
              color: '#EAD8C0',
              lineHeight: 1.1,
              marginBottom: '24px',
              maxWidth: '900px',
            }}
          >
            {title}
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: '28px',
              color: '#B2A99A',
              lineHeight: 1.4,
              maxWidth: '700px',
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Sage accent stripe — bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            backgroundColor: '#76885B',
            opacity: 0.5,
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}

