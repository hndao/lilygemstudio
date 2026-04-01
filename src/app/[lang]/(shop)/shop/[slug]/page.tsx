/**
 * Product Detail page — /shop/[slug]
 *
 * WHY RSC: All data (product + reviews + related) is fetched server-side
 * in parallel using Promise.all(). Zero client-side waterfalls.
 *
 * LAYOUT (v2.1 — no size pills):
 *  Right column top-to-bottom:
 *    Badge · H1 · Tagline · Price · Rating
 *    [VN]    → ProductVNPanel (ColorSwatches + SpecsBox + BuyBox)
 *    [Global] → SpecsBox + AffiliateCTA
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getProduct, getReviews, getSiteSettings, getListingBySlug, getListings } from '@/lib/api';
import { getDictionary } from '@/lib/i18n';
import { productJsonLd, breadcrumbJsonLd, generateProductMeta } from '@/lib/seo';
import { ProductImageGallery } from '@/components/features/ProductImageGallery';
import { ProductColorProvider } from '@/context/ProductColorContext';
import { ListingGrid } from '@/components/features/ListingGrid';
import { AffiliateCTA } from '@/components/features/AffiliateCTA';
import { ProductVNPanel } from '@/components/features/ProductVNPanel';
import { ExpertVerdict } from '@/components/features/ExpertVerdict';
import { FeatureAnalysis } from '@/components/features/FeatureAnalysis';
import { BlocksRenderer } from '@/components/features/BlocksRenderer';
import { MobileStickyBar } from '@/components/features/MobileStickyBar';
import { ReviewGrid } from '@/components/features/ReviewGrid';
import { LikeButton } from '@/components/features/LikeButton';
import { ReviewForm } from '@/components/features/ReviewForm';
import { StarRating } from '@/components/ui/StarRating';
import { PriceLine } from '@/components/ui/PriceLine';
import { Badge } from '@/components/ui/Badge';
import { ListingBadgePill } from '@/components/ui/ListingBadgePill';

export const revalidate = 3600; // 1h ISR — matches PRODUCT_DETAIL TTL

interface ProductPageProps {
  params: Promise<{ slug: string; lang: string }>;
  searchParams: Promise<{ preview_token?: string }>;
}

export async function generateMetadata({ params, searchParams }: ProductPageProps): Promise<Metadata> {
  const { slug, lang } = await params;
  const { preview_token: token } = await searchParams;
  try {
    // slug is a listing slug — resolve to product slug first
    const { data: listing } = await getListingBySlug(slug);
    const productSlug = listing.bundleProducts[0]?.slug;
    if (!productSlug) return { title: 'Product Not Found' };
    const { data: product } = await getProduct(productSlug, token);
    const meta = generateProductMeta(product, { listingSlug: slug, lang });
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

  // slug is a listing slug — resolve listing first, then fetch product by product slug
  const listingRes = await getListingBySlug(slug).catch(() => null);
  if (!listingRes) notFound();

  const directListing = listingRes.data;
  const productSlug = directListing.bundleProducts[0]?.slug;
  if (!productSlug) notFound();

  const [productRes, reviewsRes, dict, settings] = await Promise.all([
    getProduct(productSlug, token).catch(() => null),
    getReviews(productSlug, 1).catch(() => ({ data: [], meta: { total: 0, currentPage: 1, lastPage: 1, perPage: 12 } })),
    getDictionary(lang),
    getSiteSettings().catch(() => null),
  ]);

  const zaloUrl = settings?.social?.social_zalo;
  const messengerUrl = settings?.social?.social_messenger;

  if (!productRes) notFound();

  const product = productRes.data;
  const reviews = reviewsRes.data;

  // Always use listings for "You May Also Like" — product slugs can't be used
  // as shop URLs since the detail page routes by listing slug, not product slug.
  const relatedListings = await getListings({ category: product.category?.slug, perPage: 5, platform: 'direct' })
    .then((r) => r.data.filter((l) => l.slug !== slug).slice(0, 4))
    .catch(() => []);

  // Listing images take precedence over product images when available
  const galleryImages = directListing?.images?.length
    ? directListing.images
    : product.images?.length > 0 ? product.images : [product.coverImage];

  // Listing prices override product prices when explicitly set on the listing
  const listingPrice = directListing?.priceCents
    ? { amount: directListing.priceCents, currency: 'USD' as const, formatted: directListing.formattedPrice ?? '' }
    : null;
  const listingCompareAtPrice = directListing?.comparePriceCents
    ? { amount: directListing.comparePriceCents, currency: 'USD' as const, formatted: directListing.formattedCompareAtPrice ?? '' }
    : null;
  const listingPriceVnd = directListing?.priceCentsVnd
    ? { amount: directListing.priceCentsVnd, currency: 'USD' as const, formatted: directListing.formattedPriceVnd ?? '' }
    : null;
  const listingCompareAtPriceVnd = directListing?.comparePriceCentsVnd
    ? { amount: directListing.comparePriceCentsVnd, currency: 'USD' as const, formatted: directListing.formattedCompareAtPriceVnd ?? '' }
    : null;

  const displayName = lang === 'vi'
    ? (directListing?.titleVi || directListing?.title || product.nameVi || product.name)
    : (directListing?.title || product.name);
  const displayTagline = lang === 'vi'
    ? (directListing?.taglineVi || directListing?.tagline || product.taglineVi || product.tagline)
    : (directListing?.tagline || product.tagline);
  const displayCategoryName = lang === 'vi' && product.category?.nameVi ? product.category.nameVi : product.category?.name;
  const displayDescription = lang === 'vi' && product.descriptionVi ? product.descriptionVi : product.description;


  // ── Breadcrumbs ────────────────────────────────────────────────────────────
  const crumbs = [
    { name: 'Home', url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lilygemstudio.com'}/${lang}` },
    { name: 'Shop', url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lilygemstudio.com'}/${lang}/shop` },
    ...(product.category ? [{ name: displayCategoryName, url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lilygemstudio.com'}/${lang}/shop?category=${product.category.slug}` }] : []),
    { name: displayName, url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lilygemstudio.com'}/${lang}/shop/${slug}` },
  ];

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 md:py-10 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product, reviews, directListing, lang)) }}
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
          <li className="max-w-[160px] truncate font-500 text-(--color-stone)">{displayName}</li>
        </ol>
      </nav>

      {/* Split layout: image left, info right */}
      {/* ProductColorProvider bridges color swatch selection → gallery image filtering */}
      <ProductColorProvider>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
        <ProductImageGallery images={galleryImages} productName={displayName} videoUrl={product.videoUrl} />

        {/* Product info — right column */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {product.badge && <Badge variant={product.badge} />}
            {product.categories && product.categories.length > 0 && product.categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/${lang}/shop?category=${cat.slug}`}
                className="rounded-full border border-(--color-border) px-2.5 py-0.5 text-[11px] font-500 text-(--color-muted) hover:border-(--color-cta) hover:text-(--color-cta) transition-colors"
              >
                {lang === 'vi' && cat.nameVi ? cat.nameVi : cat.name}
              </Link>
            ))}
          </div>

          <h1 className="text-2xl leading-tight md:text-3xl lg:text-4xl">{displayName}</h1>
          <p className="text-[13px] font-500 text-(--color-cta)">{displayTagline}</p>

          {/* Listing badges — all badges shown on detail page (up to 3) */}
          {directListing?.badges && directListing.badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {directListing.badges.map((badge) => (
                <ListingBadgePill key={badge.id} badge={badge} size="md" />
              ))}
            </div>
          )}

          {(listingPrice ?? product.price).amount > 0 && (
            <PriceLine
              price={listingPrice ?? product.price}
              compareAtPrice={listingCompareAtPrice ?? product.compareAtPrice}
              priceVnd={listingPriceVnd ?? product.priceVnd}
              compareAtPriceVnd={listingCompareAtPriceVnd ?? product.compareAtPriceVnd}
              size="lg"
            />
          )}

          <div className="flex flex-wrap items-center gap-3">
            <StarRating
              rating={product.reviewSummary.averageRating}
              count={product.reviewSummary.totalCount}
              size="md"
            />
            <LikeButton
              productSlug={productSlug}
              initialCount={product.likesCount ?? 0}
              dict={dict.like}
            />
          </div>

          {/* Social proof micro-signal */}
          {((product.likesCount ?? 0) > 0 || product.reviewSummary.totalCount > 0) && (
            <p className="text-[12px] text-(--color-muted)">
              {(product.likesCount ?? 0) > 0 && (
                <span>{product.likesCount} {lang === 'vi' ? 'người yêu thích' : 'people loved this'}</span>
              )}
              {(product.likesCount ?? 0) > 0 && product.reviewSummary.totalCount > 0 && <span> · </span>}
              {product.reviewSummary.totalCount > 0 && (
                <span>{product.reviewSummary.totalCount} {lang === 'vi' ? 'đánh giá' : 'reviews'}</span>
              )}
            </p>
          )}

          {product.verdict && <ExpertVerdict verdict={product.verdict} />}

          <div className="h-px bg-(--color-border)" aria-hidden="true" />

          {/* ── VN: VariantPicker + BuyBox ── */}
          <div className="geo-show-vn w-full">
            <ProductVNPanel
              productId={product.id}
              productSlug={productSlug}
              productName={displayName}
              price={product.price}
              priceVnd={product.priceVnd}
              zaloUrl={zaloUrl}
              messengerUrl={messengerUrl}
              coverImage={galleryImages[0].src}
              stockQuantity={product.quantity}
              dict={dict.buybox}
              listing={directListing}
            />
          </div>

          {/* ── Global: VariantPicker + BuyBox (USD, no Zalo); no listing → AffiliateCTA ── */}
          <div className="geo-hide-vn w-full flex flex-col gap-5">
            {directListing ? (
              <ProductVNPanel
                productId={product.id}
                productSlug={productSlug}
                productName={displayName}
                price={product.price}
                priceVnd={product.priceVnd}
                coverImage={galleryImages[0].src}
                stockQuantity={product.quantity}
                dict={dict.buybox}
                listing={directListing}
                preferVnd={false}
              />
            ) : (
              <>
                <AffiliateCTA
                  affiliateLink={product.affiliateLink}
                  affiliateLinkVn={product.affiliateLinkVn}
                  productId={product.id}
                  productSlug={productSlug}
                  productName={displayName}
                  price={product.price}
                  priceVnd={product.priceVnd}
                />
              </>
            )}
          </div>

        </div>
      </div>
      </ProductColorProvider>

      {/* ── Below-the-fold ─────────────────────────────────────────────────── */}

      {product.pros_cons && (
        <FeatureAnalysis pros_cons={product.pros_cons} className="mt-12" />
      )}

      {product.blocks && product.blocks.length > 0 && (
        <BlocksRenderer blocks={product.blocks} className="mt-10" />
      )}

      {displayDescription && (
        <div className="mt-12">
          <h2 className="mb-4 font-heading text-base font-700 text-(--color-stone)">
            {lang === 'vi' ? 'Mô tả sản phẩm' : 'Description'}
          </h2>
          <div
            className="prose max-w-none text-sm leading-relaxed text-(--color-muted)"
            dangerouslySetInnerHTML={{ __html: displayDescription }}
          />
        </div>
      )}

      <blockquote className="mt-16 border-l-2 border-(--color-sand-dark) pl-5 text-sm italic leading-relaxed text-(--color-muted)">
        Every piece featured on LilyGem Studio is carefully crafted and verified for quality.
        When you shop with us, you support independent artisans. No middlemen, no mystery — just authentic beauty you can trust.
      </blockquote>

      {/* ── Reviews section ────────────────────────────────────────────────── */}
      <section className="mt-16" aria-labelledby="reviews-heading">
        <ReviewGrid reviews={reviews} totalCount={reviewsRes.meta.total} />
        <div className="mt-8">
          <ReviewForm productSlug={productSlug} dict={dict.review} />
        </div>
      </section>

      {relatedListings.length > 0 && (
        <section className="mt-16" aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-6">{dict.product.related_products}</h2>
          <ListingGrid listings={relatedListings} priorityCount={0} />
        </section>
      )}

      <MobileStickyBar
        productId={product.id}
        productSlug={productSlug}
        productName={displayName}
        price={product.price}
        priceVnd={product.priceVnd}
        coverImage={galleryImages[0]}
        affiliateLink={product.affiliateLink}
        zaloUrl={zaloUrl}
        stockQuantity={product.quantity}
        dict={dict.buybox}
        listing={directListing}
      />
    </main>
  );
}
