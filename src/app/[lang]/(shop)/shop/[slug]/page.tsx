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
import { ReviewCard } from '@/components/features/ReviewCard';
import { ReviewsDialog } from '@/components/features/ReviewsDialog';
import { ReviewForm } from '@/components/features/ReviewForm';
import { StarRating } from '@/components/ui/StarRating';
import { PriceLine } from '@/components/ui/PriceLine';
import { Badge } from '@/components/ui/Badge';
import { ListingBadgePill } from '@/components/ui/ListingBadgePill';
import { ProductSpecs } from '@/components/features/ProductSpecs';
import { FengShuiCard } from '@/components/features/FengShuiCard';

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
    const meta = generateProductMeta(product, { listingSlug: slug, lang, listingTitle: listing.title ?? undefined });
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
    getReviews(slug, 1).catch(() => ({ data: [], meta: { total: 0, currentPage: 1, lastPage: 1, perPage: 12 } })),
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
  // Listing brand story takes priority; falls back to product brand story.
  const rawBrandStory   = directListing?.brandStory   ?? product.brandStory;
  const rawBrandStoryVi = directListing?.brandStoryVi ?? product.brandStoryVi;
  const displayBrandStory = lang === 'vi' && rawBrandStoryVi ? rawBrandStoryVi : rawBrandStory;


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
        {/* Left column: gallery + reviews preview */}
        <div className="flex flex-col gap-8">
          <ProductImageGallery images={galleryImages} productName={displayName} videoUrl={product.videoUrl} />

          {/* ── Reviews under gallery ─────────────────────────────── */}
          <div>
            <h2 className="mb-4 font-heading text-base font-700 text-(--color-stone)">
              {dict.review.customer_reviews}
              {(directListing.reviewCount ?? 0) > 0 && (
                <span className="ml-1.5 font-400 text-(--color-muted)">({directListing.reviewCount})</span>
              )}
            </h2>

            {reviews.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="flex gap-0.5 text-[28px] leading-none text-(--color-sand-dark)" aria-hidden="true">
                  {'☆'.repeat(5)}
                </div>
                <p className="text-[14px] font-600 text-(--color-stone)">{dict.review.no_reviews}</p>
                <p className="text-[13px] text-(--color-muted)">{dict.review.be_first}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {reviews.slice(0, 3).map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}

            <ReviewsDialog
              reviews={reviews}
              totalCount={reviewsRes.meta.total}
              averageRating={directListing.averageRating ?? null}
              dict={dict.review}
            />
          </div>
        </div>

        {/* Product info — right column */}
        <div className="flex flex-col gap-4">
          {/* ── Price — top of column, highlighted ───────────────────── */}
          {(listingPrice ?? product.price).amount > 0 && (
            <div className="inline-flex">
              <PriceLine
                price={listingPrice ?? product.price}
                compareAtPrice={listingCompareAtPrice ?? product.compareAtPrice}
                priceVnd={listingPriceVnd ?? product.priceVnd}
                compareAtPriceVnd={listingCompareAtPriceVnd ?? product.compareAtPriceVnd}
                size="lg"
              />
            </div>
          )}

          {/* ── Listing badges only — hidden when none assigned ──────── */}
          {directListing?.badges && directListing.badges.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {directListing.badges.map((badge) => (
                <ListingBadgePill key={badge.id} badge={badge} size="md" />
              ))}
            </div>
          )}

          <h1
            className="font-heading text-xl leading-tight md:text-2xl lg:text-3xl"
          >{displayName}</h1>
          {displayTagline && (
            <p className="font-heading text-[15px] font-300 italic text-(--color-muted)">{displayTagline}</p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <StarRating
              rating={directListing.averageRating ?? 0}
              count={directListing.reviewCount ?? 0}
              size="md"
            />
            {(directListing.likesCount ?? 0) > 0 && (
              <span className="flex items-center gap-1.5 text-[13px] text-(--color-muted)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span className="font-500">{directListing.likesCount}</span>
              </span>
            )}
          </div>

          {product.verdict && <ExpertVerdict verdict={product.verdict} />}

          {/* Brand story — decorative quote card above variant pickers */}
          {displayBrandStory && (
            <div className="overflow-hidden rounded-[14px] bg-(--color-cream) px-7 py-6">
              <div
                className="relative font-heading text-[15px] font-300 italic leading-[1.75] text-(--color-stone) prose-p:m-0"
                dangerouslySetInnerHTML={{ __html: displayBrandStory }}
              />
            </div>
          )}

          <div className="h-px bg-(--color-border)" aria-hidden="true" />

          {/* ── VN: VariantPicker + BuyBox ── */}
          <div className="geo-show-vn w-full">
            <ProductVNPanel
              productId={product.id}
              listingSlug={slug}
              productName={displayName}
              price={product.price}
              priceVnd={product.priceVnd}
              zaloUrl={zaloUrl}
              messengerUrl={messengerUrl}
              coverImage={galleryImages[0].src}
              stockQuantity={product.quantity}
              dict={dict.buybox}
              listing={directListing}
              trustBadges={product.trustBadges}
              variants={product.variants}
              lang={lang}
              sizeGuideLabel={dict.buybox.size_guide}
            />
          </div>

          {/* ── Global: VariantPicker + BuyBox (USD, no Zalo); no listing → AffiliateCTA ── */}
          <div className="geo-hide-vn w-full flex flex-col gap-5">
            {directListing ? (
              <ProductVNPanel
                productId={product.id}
                listingSlug={slug}
                productName={displayName}
                price={product.price}
                priceVnd={product.priceVnd}
                coverImage={galleryImages[0].src}
                stockQuantity={product.quantity}
                dict={dict.buybox}
                listing={directListing}
                preferVnd={false}
                trustBadges={product.trustBadges}
                variants={product.variants}
                lang={lang}
                sizeGuideLabel={dict.buybox.size_guide}
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

          {/* Specs — inside right column; hidden for multi-product bundles */}
          {product.customFields && Object.keys(product.customFields).length > 0
            && directListing.bundleProducts.length <= 1
            && (
              <ProductSpecs
                customFields={product.customFields as Record<string, string | number | boolean | import('@/types').ColorFieldValue>}
                customFieldDefinitions={product.customFieldDefinitions}
                lang={lang}
                className="mt-2"
              />
            )
          }

          {/* Feng shui section — inside right column per mockup */}
          {product.fengShui && (
            <FengShuiCard profile={product.fengShui} lang={lang} className="mt-2" />
          )}

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
            {dict.product.description_heading}
          </h2>
          <div
            className="prose max-w-none text-sm leading-relaxed text-(--color-muted)"
            dangerouslySetInnerHTML={{ __html: displayDescription }}
          />
        </div>
      )}

      <blockquote className="mt-16 border-l-2 border-(--color-sand-dark) pl-5 text-sm italic leading-relaxed text-(--color-muted)">
        {dict.product.trust_quote}
      </blockquote>

      {/* ── Write a review ─────────────────────────────────────────────────── */}
      <div className="mt-12">
        <ReviewForm listingSlug={slug} dict={dict.review} />
      </div>

      {relatedListings.length > 0 && (
        <section className="mt-16" aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-6">{dict.product.related_products}</h2>
          <ListingGrid listings={relatedListings} priorityCount={0} />
        </section>
      )}

      <MobileStickyBar
        productId={product.id}
        listingSlug={slug}
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
