/**
 * DARIIV — SEO Meta Engine
 *
 * WHY CENTRALISED: Metadata generation logic (OG tags, JSON-LD, canonical URLs)
 * is complex enough to warrant its own module. Keeping it here means:
 *  1. A single place to update when Google changes structured data requirements
 *  2. Type-safe metadata — no string typos in og:type or schema @type values
 *  3. Consistent canonical URL construction across all pages
 *
 * JSON-LD SCHEMAS USED:
 *  - Product: for product detail pages (enables Google Shopping rich results)
 *    Includes: Brand, Offer, AggregateRating, individual Review items
 *  - BreadcrumbList: for catalog + detail pages (enables breadcrumb rich results)
 *  - WebSite: for homepage (enables sitelinks search box)
 *
 * SCHEMA COVERAGE (Google Rich Results eligibility):
 *  - Product + Offer → Google Shopping panel
 *  - AggregateRating → Star snippet in organic SERPs
 *  - Review items    → "Reviews from the web" carousel
 *  - Brand           → Knowledge Graph brand association
 */

import type { Metadata } from 'next';
import type { ProductDetail, ProductCard, Review, Post, ContentBlock, ListingCard } from '@/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dariiv.com';
const SITE_NAME = 'DARIIV';

// ── Metadata generators ────────────────────────────────────────────────────────

/**
 * WHY listingSlug + lang options:
 *  - listingSlug: shop pages route by listing slug, so canonical must use it.
 *  - lang: lilygemstudio serves /en/shop/[slug] and /vi/shop/[slug] — hreflang
 *    alternates tell Google which language version to show per locale, preventing
 *    the wrong language from ranking for Vietnamese vs English queries.
 */
export function generateProductMeta(product: ProductDetail, options?: { listingSlug?: string; lang?: string; listingTitle?: string }): Metadata {
  const pageSlug = options?.listingSlug ?? product.slug;
  const lang = options?.lang ?? 'en';
  const url = `${SITE_URL}/${lang}/shop/${pageSlug}`;
  // WHY dynamic OG route: Pinterest/TikTok crawlers cache the first OG image
  // they see. A branded 1200×630 with product name + price gets 3–5× more
  // repins/shares than a raw product photo with no context overlay.
  const ogImageUrl = `${SITE_URL}/api/og/product/${product.slug}`;

  // WHY listingTitle takes precedence: the listing title is what the admin named
  // this sellable item (e.g. "Moonlight & Golden Veil Agate Bangle Set") and is
  // what appears as the page H1. The product's AI-imported seo.meta_title is an
  // SEO-optimised fallback for when no listing title is provided.
  const seo = product.metadata?.seo;
  const title = options?.listingTitle ?? seo?.meta_title ?? product.name;
  const description = seo?.meta_description ?? product.tagline;

  return {
    title,
    description,
    ...(seo?.keywords?.length && { keywords: seo.keywords }),
    alternates: {
      canonical: url,
      // WHY x-default = en: Google uses x-default for users whose language has
      // no exact match. English is the broader international audience.
      languages: {
        en: `${SITE_URL}/en/shop/${pageSlug}`,
        vi: `${SITE_URL}/vi/shop/${pageSlug}`,
        'x-default': `${SITE_URL}/en/shop/${pageSlug}`,
      },
    },
    openGraph: {
      title: seo?.meta_title ?? `${product.name} | ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          alt: `${product.name} — ${SITE_NAME}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo?.meta_title ?? product.name,
      description,
      images: [ogImageUrl],
    },
  };
}

export function generateCatalogMeta(params?: {
  category?: string;
  page?: number;
}): Metadata {
  const categoryLabel = params?.category
    ? ` — ${params.category.charAt(0).toUpperCase() + params.category.slice(1)}`
    : '';
  const pageLabel = params?.page && params.page > 1 ? ` (Page ${params.page})` : '';
  const title = `Shop All Artisan Products${categoryLabel}${pageLabel}`;
  const description =
    'Browse our curated collection of handpicked artisan goods with verified reviews and transparent affiliate disclosures.';

  // WHY title param: the generic OG route accepts ?title= so the catalog OG
  // image reflects the current category filter rather than a static headline.
  const ogTitle = encodeURIComponent(`Shop${categoryLabel || ' All Artisan Products'}`);
  const ogImageUrl = `${SITE_URL}/api/og?title=${ogTitle}`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/shop` },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `${SITE_URL}/shop`,
      siteName: SITE_NAME,
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          alt: `${title} | ${SITE_NAME}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

// ── JSON-LD structured data ────────────────────────────────────────────────────

/**
 * Product schema — enables Google Shopping rich results.
 *
 * WHY reviews param: Google's "Reviews from the web" carousel requires
 * individual Review items in the schema, not just AggregateRating.
 * Passing the first page of reviews (≤12) gives Google enough signal
 * to surface the review carousel without bloating the JSON-LD payload.
 *
 * WHY Brand from metadata.origin: The API stores artisan provenance in
 * metadata.origin (e.g. "Vermont, USA"). Using it as the Brand name
 * gives Google a geographic brand signal that improves local SEO.
 * Falls back to category name, then "DARIIV" as the brand entity.
 */
/**
 * WHY listing + lang params: see dariiv-web/src/lib/seo.ts for full rationale.
 * For lilygemstudio, the offer URL includes the lang prefix so Google crawls
 * the correct language version of the page.
 */
export function productJsonLd(product: ProductDetail, reviews: Review[] = [], listing?: ListingCard, lang?: string): object {
  // WHY metadata.origin: artisan provenance stored by the importer/admin
  // (e.g. "Vermont, USA") gives Google a geographic brand signal.
  // Falls back to category name, then the site name.
  const brandName = product.metadata?.origin ?? product.category?.name ?? SITE_NAME;

  // Use listing price when available (may differ from product base price for sales/bundles)
  const priceAmount = listing?.priceCents ?? product.price.amount;

  // Reflect real stock state: OutOfStock prevents misleading Rich Results
  const isInStock = listing
    ? listing.isLive && (listing.quantity === null || listing.quantity > 0)
    : true;
  const availability = isInStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

  // Canonical page URL as offer URL; affiliate link is a separate redirect
  const langPrefix = lang ?? 'en';
  const offerUrl = listing?.slug
    ? `${SITE_URL}/${langPrefix}/shop/${listing.slug}`
    : product.affiliateLink.url;

  const offer: Record<string, unknown> = {
    '@type': 'Offer',
    price: (priceAmount / 100).toFixed(2),
    priceCurrency: 'USD',
    availability,
    itemCondition: 'https://schema.org/NewCondition',
    url: offerUrl,
    seller: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  // Flash sale / limited-time pricing validity window
  if (listing?.validUntil) {
    offer.priceValidUntil = listing.validUntil.split('T')[0]; // YYYY-MM-DD
  }

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.tagline,
    image: product.images?.length > 0
      ? product.images.map((img) => img.src)
      : [product.coverImage.src],
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: brandName,
    },
    offers: offer,
  };

  // VideoObject — enables Google's video rich result on the product page.
  // WHY preload="none" on the <video> tag is irrelevant to JSON-LD: structured
  // data tells Google the video exists; the element attribute controls loading.
  // thumbnailUrl points to the cover image so Google has a fallback poster.
  if (product.videoUrl) {
    schema.video = {
      '@type': 'VideoObject',
      name: `${product.name} — Product Video`,
      description: product.tagline,
      thumbnailUrl: product.coverImage.src,
      contentUrl: product.videoUrl,
    };
  }

  // Custom fields → schema.org additionalProperty + direct fields
  // WHY additionalProperty: Google supports PropertyValue pairs for arbitrary
  // product specs. Injecting them here extends the Shopping rich result with
  // structured spec data (material, sustainability score, etc.).
  const customFields = product.customFields ?? {};
  if (Object.keys(customFields).length > 0) {
    schema.additionalProperty = Object.entries(customFields).map(([name, value]) => ({
      '@type': 'PropertyValue',
      name: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      value: String(value),
    }));

    // Inject known schema.org direct fields when present in custom_fields.
    if (customFields.material) schema.material = String(customFields.material);
    if (customFields.color) schema.color = String(customFields.color);
    if (customFields.sustainability_score) {
      // WHY sustainabilityNote: Google's eco-friendly rich result uses this field.
      schema.sustainabilityNote = `Sustainability Score: ${customFields.sustainability_score}`;
    }
  }

  // AggregateRating — only include when we have real review data
  if (product.reviewSummary.totalCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.reviewSummary.averageRating.toFixed(1),
      reviewCount: product.reviewSummary.totalCount,
      bestRating: '5',
      worstRating: '1',
    };
  }

  // Individual Review items — enables "Reviews from the web" carousel in SERPs
  if (reviews.length > 0) {
    schema.review = reviews.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.authorName },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating,
        bestRating: '5',
        worstRating: '1',
      },
      name: r.title,
      reviewBody: r.body,
      datePublished: r.publishedAt,
    }));
  }

  return schema;
}

/** BreadcrumbList schema — enables breadcrumb rich results in SERPs */
export function breadcrumbJsonLd(
  crumbs: Array<{ name: string; url: string }>,
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/** WebSite schema — enables sitelinks search box on homepage */
export function websiteJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/shop?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

// ── Journal metadata generator ─────────────────────────────────────────────────

export function generateJournalMeta(post: Post): Metadata {
  const url = `${SITE_URL}/journal/${post.slug}`;
  return {
    title: `${post.title} | ${SITE_NAME} Journal`,
    description: post.title,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      url,
      siteName: SITE_NAME,
      type: 'article',
      publishedTime: post.publishedAt,
      images: [{ url: post.featuredImage.src, width: post.featuredImage.width, height: post.featuredImage.height }],
    },
    twitter: { card: 'summary_large_image', title: post.title, images: [post.featuredImage.src] },
  };
}

// ── Journal JSON-LD ───────────────────────────────────────────────────────────

/**
 * Article schema for journal posts.
 * WHY Article: Enables Google's "Top Stories" carousel and article rich results.
 * The publisher Organization entity links back to DARIIV as the editorial brand.
 *
 * WHY articleBody from blocks: articles no longer have a flat `content` string.
 * We extract all text from TextBlock and SplitBlock html fields, strip tags,
 * and concatenate to produce the articleBody value for structured data.
 * Google uses articleBody to understand article content for rich results.
 */
export function articleJsonLd(post: Post): object {
  // Collect all image URLs from image and split blocks for the `image` array.
  const blockImages = (post.blocks ?? [])
    .filter((b) => b.type === 'image' || b.type === 'split')
    .map((b) => (b as { type: string; data: { src: string } }).data.src);

  const images = post.featuredImage?.src 
    ? [post.featuredImage.src, ...blockImages]
    : blockImages;

  // Extract plain text from all text-bearing blocks for articleBody.
  const articleBody = (post.blocks ?? [])
    .map((b) => {
      if (b.type === 'text' || b.type === 'split') return b.data.html;
      return '';
    })
    .join(' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    image: images.length > 0 ? images : [ `${SITE_URL}/api/og?title=${encodeURIComponent(post.title)}` ],
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/api/og` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/journal/${post.slug}` },
    ...(articleBody ? { articleBody } : {}),
  };
}

/**
 * FAQPage schema — enables Google FAQ rich results (accordion in SERPs).
 *
 * WHY SEPARATE FROM articleJsonLd: Google validates Article and FAQPage as
 * distinct schema types. Merging them into one object would cause validation
 * errors in Google's Rich Results Test. Each gets its own <script> tag.
 *
 * Returns null when no faq_schema blocks exist so the caller can skip the tag.
 */
export function faqJsonLd(blocks: ContentBlock[]): object | null {
  const items = blocks
    .filter((b): b is Extract<ContentBlock, { type: 'faq_schema' }> => b.type === 'faq_schema')
    .flatMap((b) => b.data.items ?? [])
    .filter((item) => item.question && item.answer);

  if (items.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

// ── Type re-export for convenience ────────────────────────────────────────────
export type { ProductCard, ProductDetail, Review, Post };

