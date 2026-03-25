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
import { getProduct, getReviews, getProductsBySlugs, getSiteSettings } from '@/lib/api';
import { getDictionary } from '@/lib/i18n';
import { productJsonLd, breadcrumbJsonLd, generateProductMeta } from '@/lib/seo';
import { ProductImageGallery } from '@/components/features/ProductImageGallery';
import { ProductTabs } from '@/components/features/ProductTabs';
import { ProductGrid } from '@/components/features/ProductGrid';
import { ArtisanSpotlight } from '@/components/features/ArtisanSpotlight';
import { AffiliateCTA } from '@/components/features/AffiliateCTA';
import { ProductVNPanel } from '@/components/features/ProductVNPanel';
import { SpecsBox } from '@/components/features/SpecsBox';
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
import type { ColorOption, FieldWithValue } from '@/types';

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
    const meta = generateProductMeta(product);
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

  const [productRes, reviewsRes, dict, settings] = await Promise.all([
    getProduct(slug, token).catch(() => null),
    getReviews(slug, 1).catch(() => ({ data: [], meta: { total: 0, currentPage: 1, lastPage: 1, perPage: 12 } })),
    getDictionary(lang),
    getSiteSettings().catch(() => null),
  ]);

  const zaloUrl = settings?.social?.social_zalo;
  const messengerUrl = settings?.social?.social_messenger;

  if (!productRes) notFound();

  const product = productRes.data;
  const reviews = reviewsRes.data;

  const relatedSlugs = product.tags.slice(0, 4).filter((t) => t !== slug);
  const relatedProducts = relatedSlugs.length > 0
    ? await getProductsBySlugs(relatedSlugs)
    : [];

  const galleryImages = product.images?.length > 0 ? product.images : [product.coverImage];

  const displayName = lang === 'vi' && product.nameVi ? product.nameVi : product.name;
  const displayTagline = lang === 'vi' && product.taglineVi ? product.taglineVi : product.tagline;
  const displayCategoryName = lang === 'vi' && product.category?.nameVi ? product.category.nameVi : product.category?.name;
  const displayDescription = lang === 'vi' && product.descriptionVi ? product.descriptionVi : product.description;


  // ── Split custom fields by display_position ────────────────────────────────
  const defs = product.customFieldDefinitions ?? [];
  const fieldValues = product.customFields ?? {};

  // Specs box: non-color fields routed to specs_box (or unset, which defaults to specs_box).
  // FALLBACK: when the category has no definitions yet, auto-label every value
  // from customFields. Single ColorFieldValue objects ({ name, hex }) are shown
  // as text (name only); arrays (multi-color) are skipped here and handled below.
  const specsBoxFields: FieldWithValue[] = defs.length > 0
    ? defs
        .filter((def) => {
          const pos = def.display_position ?? 'specs_box';
          // Multi-color above_cart fields go to ColorSwatches, not SpecsBox
          if (def.type === 'color' && def.multiple && pos === 'above_cart') return false;
          return pos === 'specs_box';
        })
        .flatMap((def) => {
          const value = fieldValues[def.name];
          if (value == null || value === '') return [];
          // Single color: extract name for display and attach hex for the swatch dot
          if (def.type === 'color' && typeof value === 'object' && !Array.isArray(value)) {
            const cv = value as { name: string; hex: string };
            return [{ definition: { ...def, hex: cv.hex }, value: cv.name }];
          }
          return [{ definition: def, value: value as string | number | boolean }];
        })
    : Object.entries(fieldValues)
        .filter(([, v]) => {
          if (v === null || v === undefined || v === '') return false;
          if (Array.isArray(v)) return false; // skip ColorOption[] arrays
          return true;
        })
        .map(([key, value]) => {
          const isColor = typeof value === 'object' && value !== null;
          const cv = isColor ? (value as { name: string; hex: string }) : null;
          return {
            definition: {
              name: key,
              label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
              type: isColor ? 'color' as const : 'text' as const,
              ...(cv ? { hex: cv.hex } : {}),
            },
            value: cv ? cv.name : value as string | number | boolean,
          };
        });

  // Above-cart color field (multi-color picker)
  const colorDef = defs.find(
    (def) => def.type === 'color' && def.display_position === 'above_cart' && def.multiple,
  );
  const colorOptions: ColorOption[] | undefined =
    colorDef && Array.isArray(fieldValues[colorDef.name])
      ? (fieldValues[colorDef.name] as ColorOption[])
      : undefined;
  const colorLabel = colorDef?.label;

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
          <li className="max-w-[160px] truncate font-500 text-(--color-stone)">{displayName}</li>
        </ol>
      </nav>

      {/* Split layout: image left, info right */}
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

          <div className="flex flex-wrap items-center gap-3">
            <StarRating
              rating={product.reviewSummary.averageRating}
              count={product.reviewSummary.totalCount}
              size="md"
            />
            <LikeButton
              productSlug={slug}
              initialCount={product.likesCount ?? 0}
              dict={dict.like}
            />
          </div>

          {product.verdict && <ExpertVerdict verdict={product.verdict} />}

          <div className="h-px bg-(--color-border)" aria-hidden="true" />

          {/* ── VN: ColorSwatches + SpecsBox + BuyBox (in ProductVNPanel) ── */}
          <div className="geo-show-vn w-full">
            <ProductVNPanel
              colorOptions={colorOptions}
              colorLabel={colorLabel}
              specsBoxFields={specsBoxFields}
              productId={product.id}
              productSlug={slug}
              productName={displayName}
              price={product.price}
              priceVnd={product.priceVnd}
              zaloUrl={zaloUrl}
              messengerUrl={messengerUrl}
              coverImage={galleryImages[0].src}
              stockQuantity={product.quantity}
              dict={dict.buybox}
            />
          </div>

          {/* ── Global: SpecsBox + AffiliateCTA ────────────────────────── */}
          <div className="geo-hide-vn w-full flex flex-col gap-5">
            <SpecsBox fields={specsBoxFields} title={dict.buybox.specs_title} />
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

          {product.artisan && <ArtisanSpotlight artisan={product.artisan} />}
        </div>
      </div>

      {/* ── Below-the-fold ─────────────────────────────────────────────────── */}

      {product.pros_cons && (
        <FeatureAnalysis pros_cons={product.pros_cons} className="mt-12" />
      )}

      {product.blocks && product.blocks.length > 0 && (
        <BlocksRenderer blocks={product.blocks} className="mt-10" />
      )}

      <ProductTabs description={displayDescription ?? ''} />

      <blockquote className="mt-16 border-l-2 border-(--color-sand-dark) pl-5 text-sm italic leading-relaxed text-(--color-muted)">
        Every piece featured on LilyGem Studio is carefully crafted and verified for quality.
        When you shop with us, you support independent artisans. No middlemen, no mystery — just authentic beauty you can trust.
      </blockquote>

      {/* ── Reviews section ────────────────────────────────────────────────── */}
      <section className="mt-16" aria-labelledby="reviews-heading">
        <ReviewGrid reviews={reviews} totalCount={reviewsRes.meta.total} />
        <div className="mt-8">
          <ReviewForm productSlug={slug} dict={dict.review} />
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="mt-16" aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-6">You May Also Like</h2>
          <ProductGrid products={relatedProducts} priorityCount={0} />
        </section>
      )}

      <MobileStickyBar
        productId={product.id}
        productSlug={slug}
        productName={displayName}
        price={product.price}
        priceVnd={product.priceVnd}
        coverImage={galleryImages[0]}
        affiliateLink={product.affiliateLink}
        zaloUrl={zaloUrl}
        colorOptions={colorOptions}
        stockQuantity={product.quantity}
        dict={dict.buybox}
      />
    </main>
  );
}
