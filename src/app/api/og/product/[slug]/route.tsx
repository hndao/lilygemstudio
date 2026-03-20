/**
 * Product OG Image — GET /api/og/product/[slug]
 *
 * WHY PRODUCT-SPECIFIC OG: Pinterest and TikTok show the OG image as the
 * primary visual when a product page is shared. A generic brand image gets
 * far fewer clicks than one showing the actual product name + price.
 *
 * DESIGN: Split layout — left panel (stone bg) has product name, category
 * pill, price, and DARIIV wordmark. Right panel shows the product cover image
 * filling the full height. Sage accent stripe at top.
 *
 * FALLBACK: If the product API is unavailable, renders the generic brand OG
 * image rather than a 500 error — social crawlers cache the first response.
 *
 * CACHE: 1h at CDN edge (matches PRODUCT_DETAIL ISR TTL — see next.config.ts).
 */

import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { getProduct } from '@/lib/api';

export const runtime = 'edge';

// WHY edge runtime: ImageResponse requires the Edge Canvas API.
// getProduct() uses fetch() which is available in edge runtime.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<ImageResponse | Response> {
  const { slug } = await params;

  // Fetch product — fall back to generic OG if unavailable.
  // WHY .data: getProduct() returns ApiResponse<ProductDetail> — the actual
  // product is nested under .data per the API contract in lib/api.ts.
  const response = await getProduct(slug).catch(() => null);

  if (!response) {
    // Redirect to generic OG rather than returning a broken image
    const genericUrl = new URL('/api/og', req.url);
    return Response.redirect(genericUrl.toString(), 302);
  }

  const product = response.data;
  const price = `$${(product.price.amount / 100).toFixed(2)}`;
  const category = product.category?.name ?? 'Artisan';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
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
            height: '6px',
            backgroundColor: '#76885B',
            zIndex: 10,
          }}
        />

        {/* Left panel — product info */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '60px 56px',
            width: '580px',
            flexShrink: 0,
          }}
        >
          {/* Wordmark */}
          <div
            style={{
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '0.3em',
              color: '#76885B',
              textTransform: 'uppercase',
            }}
          >
            DARIIV
          </div>

          {/* Product info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Category pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: '#76885B',
                color: '#FDFAF6',
                fontSize: '16px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '6px 16px',
                borderRadius: '100px',
                width: 'fit-content',
              }}
            >
              {category}
            </div>

            {/* Product name */}
            <div
              style={{
                fontSize: '48px',
                fontWeight: 700,
                color: '#EAD8C0',
                lineHeight: 1.15,
              }}
            >
              {product.name}
            </div>

            {/* Tagline */}
            <div
              style={{
                fontSize: '20px',
                color: '#B2A99A',
                lineHeight: 1.4,
              }}
            >
              {product.tagline}
            </div>
          </div>

          {/* Price */}
          <div
            style={{
              fontSize: '40px',
              fontWeight: 700,
              color: '#EAD8C0',
            }}
          >
            {price}
          </div>
        </div>

        {/* Right panel — product image */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.coverImage.src}
            alt={product.coverImage.alt}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {/* Gradient overlay — left edge blends into stone panel */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: '80px',
              background: 'linear-gradient(to right, #2D3436, transparent)',
            }}
          />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}

