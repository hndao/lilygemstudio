/**
 * Product Detail page — /shop/[slug]
 *
 * WHY RSC: All data (product + reviews + related) is fetched server-side
 * in parallel using Promise.all(). Zero client-side waterfalls.
 *
 * ANTI-N+1: Related products are fetched via getProductsBySlugs() — a single
 * batch request, not a .map() of individual getProduct() calls.
 *
 * LAYOUT (from wireframes):
 *  - Mobile:  stacked — image, then info, then tabs, then related
 *  - Tablet:  split — image left (~360px), info right; tabs below full-width
 *  - Desktop: split — image left (800px), info right; tabs below full-width
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getProduct, getReviews, getProductsBySlugs } from '@/lib/api';
import { productJsonLd, breadcrumbJsonLd, generateProductMeta } from '@/lib/seo';
import { ProductImageGallery } from '@/components/features/ProductImageGallery';
import { ProductTabs } from '@/components/features/ProductTabs';
import { ProductGrid } from '@/components/features/ProductGrid';
import { ArtisanSpotlight } from '@/components/features/ArtisanSpotlight';
import { AffiliateCTA } from '@/components/features/AffiliateCTA';
import { ProductBuyBox } from '@/components/features/ProductBuyBox';
import { ExpertVerdict } from '@/components/features/ExpertVerdict';
import { FeatureAnalysis } from '@/components/features/FeatureAnalysis';
import { BlocksRenderer } from '@/components/features/BlocksRenderer';
import { MobileStickyBar } from '@/components/features/MobileStickyBar';
import { ProductSpecs } from '@/components/features/ProductSpecs';
import { StarRating } from '@/components/ui/StarRating';
import { PriceLine } from '@/components/ui/PriceLine';
import { Badge } from '@/components/ui/Badge';

export const revalidate = 3600; // 1h ISR — matches PRODUCT_DETAIL TTL

interface ProductPageProps {
  params: Promise<{ slug: string; lang: string }>;
  searchParams: Promise<{ preview_token?: string }>;
}

export async function generateMetadata({ params, searchParams }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { preview_token: token } = await searchParams;
  try {
    const { data: product } = await getProduct(slug, token);
    // WHY generateProductMeta: delegates to seo.ts which points OG images to
    // /api/og/product/[slug] — a branded 1200×630 with name + price overlay
    // that performs far better on Pinterest/TikTok than a raw product photo.
    const meta = generateProductMeta(product);
    // Draft previews must never be indexed — the page is only accessible via a
    // signed token link from the Filament admin panel.
    if (token) {
      return { ...meta, robots: { index: false, follow: false } };
    }
    return meta;
  } catch {
    return { title: 'Product Not Found' };
  }
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { slug, lang } = await params;
  const { preview_token: token } = await searchParams;

  // Parallel fetch — product + first page of reviews
  const [productRes, reviewsRes] = await Promise.all([
    getProduct(slug, token).catch(() => null),
    getReviews(slug, 1).catch(() => ({ data: [], meta: { total: 0, currentPage: 1, lastPage: 1, perPage: 12 } })),
  ]);

  if (!productRes) notFound();

  const product = productRes.data;
  const reviews = reviewsRes.data;
  const reviewCount = reviewsRes.meta.total;

  // Related products: use tags as slugs for batch fetch (anti-N+1)
  const relatedSlugs = product.tags.slice(0, 4).filter((t) => t !== slug);
  const relatedProducts = relatedSlugs.length > 0
    ? await getProductsBySlugs(relatedSlugs)
    : [];

  // Ensure gallery always has at least the cover image
  const galleryImages = product.images?.length > 0 ? product.images : [product.coverImage];

  const displayName = lang === 'vi' && product.nameVi ? product.nameVi : product.name;
  const displayTagline = lang === 'vi' && product.taglineVi ? product.taglineVi : product.tagline;
  const displayCategoryName = lang === 'vi' && product.category?.nameVi ? product.category.nameVi : product.category?.name;
  const displayDescription = lang === 'vi' && product.descriptionVi ? product.descriptionVi : product.description;
  const displayBrandStory = lang === 'vi' && product.brandStoryVi ? product.brandStoryVi : product.brandStory;

  // Extract bracelet size from product name (e.g. "57.8mm" from "57.8mm Golden Silk Veil...")
  const sizeMatch = displayName?.match(/(\d+\.?\d*)mm/);
  const defaultSize = sizeMatch ? `${sizeMatch[1]}mm` : undefined;

  const crumbs = [
    { name: 'Home', url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lilygemstudio.com'}/${lang}` },
    { name: 'Shop', url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lilygemstudio.com'}/${lang}/shop` },
    ...(product.category ? [{ name: displayCategoryName, url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lilygemstudio.com'}/${lang}/shop?category=${product.category.slug}` }] : []),
    { name: displayName, url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lilygemstudio.com'}/${lang}/shop/${slug}` },
  ];

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 md:py-10 lg:px-8">
      {/* JSON-LD structured data — injected in <head> via Next.js script */}
      {/* WHY reviews passed here: individual Review items in the schema unlock
          Google's "Reviews from the web" carousel — a significant CTR boost. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product, reviews)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-(--color-muted)">
        <ol className="flex items-center gap-1.5">
          <li><Link href={`/${lang}`} className="hover:text-(--color-stone)">Home</Link></li>
          <li aria-hidden="true">›</li>
          <li><Link href={`/${lang}/shop`} className="hover:text-(--color-stone)">Shop</Link></li>
          {product.category && (
            <>
              <li aria-hidden="true">›</li>
              <li>
                <Link href={`/${lang}/shop?category=${product.category.slug}`} className="hover:text-(--color-stone)">
                  {displayCategoryName}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden="true">›</li>
          <li className="text-(--color-stone) font-500 truncate max-w-[160px]">{displayName}</li>
        </ol>
      </nav>

      {/* Split layout: image left, info right (tablet+) */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">

        {/* Image gallery — swipe carousel on mobile, thumbnail grid on desktop */}
        <ProductImageGallery images={galleryImages} productName={displayName} videoUrl={product.videoUrl} />

        {/* Product info — right column */}
        <div className="flex flex-col gap-4">
          {/* Pill badges row */}
          {product.badge && (
            <div className="flex flex-wrap gap-2">
              <Badge variant={product.badge} />
            </div>
          )}

          {/* H1 */}
          <h1 className="text-2xl leading-tight md:text-3xl lg:text-4xl">{displayName}</h1>
          <p className="text-[13px] font-500 text-(--color-cta)">{displayTagline}</p>

          {/* Price */}
          {product.price.amount === 0 ? (
            <p className="font-heading text-lg font-700 text-(--color-cta)">
              Invaluable Peace of Mind
            </p>
          ) : (
            <PriceLine
              price={product.price}
              compareAtPrice={product.compareAtPrice}
              priceVnd={product.priceVnd}
              compareAtPriceVnd={product.compareAtPriceVnd}
              size="lg"
            />
          )}

          <StarRating
            rating={product.reviewSummary.averageRating}
            count={product.reviewSummary.totalCount}
            size="md"
          />

          {/* Expert Verdict */}
          {product.verdict && (
            <ExpertVerdict verdict={product.verdict} />
          )}

          {/* ── Buy Box: VN users get full cart experience, Global gets affiliate link ── */}

          {/* Global CTA — Shop on Etsy (hidden when country-vn) */}
          <div className="geo-hide-vn w-full">
            <AffiliateCTA
              affiliateLink={product.affiliateLink}
              affiliateLinkVn={product.affiliateLinkVn}
              productId={product.id}
              productSlug={slug}
              productName={displayName}
              price={product.price}
              priceVnd={product.priceVnd}
            />
          </div>

          {/* VN Buy Box — size selector, qty picker, 3-tier CTA (hidden by default) */}
          <div className="geo-show-vn w-full">
            <ProductBuyBox
              productId={product.id}
              productSlug={slug}
              productName={displayName}
              price={product.price}
              priceVnd={product.priceVnd}
              affiliateLinkVn={product.affiliateLinkVn}
              coverImage={galleryImages[0].src}
              defaultSize={defaultSize}
            />
          </div>

          {/* Artisan spotlight */}
          {product.artisan && (
            <ArtisanSpotlight artisan={product.artisan} />
          )}
        </div>
      </div>

      {/* ── Below-the-fold full-width sections ─────────────────────────────── */}

      {/* Pros / Cons — objectivity split */}
      {product.pros_cons && (
        <FeatureAnalysis pros_cons={product.pros_cons} className="mt-12" />
      )}

      {/* Product Specs — category-driven custom fields (Product Specs group) */}
      {product.customFields && Object.keys(product.customFields).length > 0 && (
        <ProductSpecs customFields={product.customFields} className="mt-10" />
      )}

      {/* AI content blocks — hero intro, spec_table, split */}
      {product.blocks && product.blocks.length > 0 && (
        <BlocksRenderer blocks={product.blocks} className="mt-10" />
      )}

      {/* Tabs: Description / Artisan Story / Reviews */}
      <ProductTabs
        description={displayDescription ?? ''}
        brandStory={displayBrandStory ?? ''}
        reviews={reviews}
        reviewCount={reviewCount}
      />

      {/* Integrity blockquote — trust signal at end of page */}
      <blockquote className="mt-16 border-l-2 border-(--color-sand-dark) pl-5 text-sm italic leading-relaxed text-(--color-muted)">
        Every piece featured on LilyGem Studio is carefully crafted and verified for quality. 
        When you shop with us, you support independent artisans. No middlemen, no mystery — just authentic beauty you can trust.
      </blockquote>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16" aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-6">You May Also Like</h2>
          <ProductGrid products={relatedProducts} priorityCount={0} />
        </section>
      )}

      {/* Mobile sticky bar — slides up after 600px scroll, hidden on tablet+ */}
      <MobileStickyBar
        productId={product.id}
        productSlug={slug}
        productName={displayName}
        price={product.price}
        priceVnd={product.priceVnd}
        coverImage={galleryImages[0]}
        affiliateLink={product.affiliateLink}
        affiliateLinkVn={product.affiliateLinkVn}
        defaultSize={defaultSize}
      />
    </main>
  );
}

