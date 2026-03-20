/**
 * LilyGemStudio — Typed API Client
 *
 * Shares the dariiv-api backend. All requests include `site=lilygemstudio`
 * so the backend returns only products/settings belonging to this site.
 */

/** Site key — injected as `?site=` on every API request */
const SITE_KEY = process.env.NEXT_PUBLIC_SITE_KEY ?? 'lilygemstudio';

import type {
  ProductCard,
  ProductDetail,
  Review,
  PaginatedResponse,
  ApiResponse,
  ProductListParams,
  ArtisanCard,
  Artisan,
  PostCard,
  Post,
  SiteSettings,
  CategoryWithChildren,
  PostListParams,
} from '@/types';
import { REVALIDATION, CACHE_TAGS } from '@/lib/cache';

// ── Internal base fetcher ──────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

interface FetchOptions {
  revalidate?: number | false;
  tags?: string[];
  /** When true, bypasses ISR/cache entirely — used for admin preview requests. */
  noCache?: boolean;
}

async function apiFetch<T>(endpoint: string, opts: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  // Preview requests must never be served from the ISR cache — each request
  // should hit the origin so the admin always sees the latest draft.
  const fetchInit: RequestInit = {
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    ...(opts.noCache
      ? { cache: 'no-store' }
      : { next: { revalidate: opts.revalidate ?? REVALIDATION.PRODUCT_LIST, tags: opts.tags } }
    ),
  };

  const res = await fetch(url, fetchInit);

  if (!res.ok) {
    // Structured error — caught by Next.js error boundaries
    throw new Error(`API ${res.status}: ${res.statusText} — ${url}`);
  }

  return res.json() as Promise<T>;
}

// ── Field selection helpers ────────────────────────────────────────────────────

/**
 * WHY EXPLICIT FIELDS: The API accepts a `fields` query param so PostgreSQL
 * returns only the columns we need. This cuts response payload by ~60% for
 * the product list (no description, brand_story, full metadata).
 */
const CARD_FIELDS = [
  'id', 'slug', 'name', 'tagline', 'price', 'compare_at_price',
  'cover_image', 'affiliate_url', 'affiliate_network',
  'badge', 'avg_rating', 'review_count',
].join(',');

const DETAIL_FIELDS = [
  ...CARD_FIELDS.split(','),
  'description', 'brand_story', 'images', 'category',
  'tags', 'metadata', 'artisan',
].join(',');

const ARTISAN_CARD_FIELDS = [
  'id', 'slug', 'name', 'location', 'avatar', 'bio_short', 'product_count',
].join(',');

const ARTISAN_DETAIL_FIELDS = [
  ...ARTISAN_CARD_FIELDS.split(','),
  'cover_image', 'story_origin', 'story_craft', 'story_philosophy', 'published_at',
].join(',');

const POST_CARD_FIELDS = [
  'id', 'slug', 'title', 'category', 'featured_image', 'published_at',
].join(',');

const POST_DETAIL_FIELDS = [
  ...POST_CARD_FIELDS.split(','),
  // WHY blocks not content: articles are now composed of typed content blocks.
  // blocks contains all text, image, and split data in one structured array.
  'blocks', 'related_products', 'seo', 'related_posts',
].join(',');

const REVIEW_FIELDS = [
  'id', 'author_name', 'rating', 'title', 'body',
  'verified_purchase', 'images', 'published_at',
].join(',');

// ── Public API functions ───────────────────────────────────────────────────────

/**
 * Fetch a paginated product list for the catalog grid.
 *
 * WHY BATCH: All 24 cards' data (including review summaries) comes back in ONE
 * query. The API uses eager loading on the backend — no N+1, no waterfall.
 */
export async function getProducts(
  params: ProductListParams = {},
): Promise<PaginatedResponse<ProductCard>> {
  const qs = new URLSearchParams({
    site: SITE_KEY,
    fields: CARD_FIELDS,
    page: String(params.page ?? 1),
    per_page: String(params.perPage ?? 24),
    ...(params.category && { category: params.category }),
    ...(params.sort && { sort: params.sort }),
    ...(params.badge && { badge: params.badge }),
  });

  return apiFetch<PaginatedResponse<ProductCard>>(`/products?${qs}`, {
    revalidate: REVALIDATION.PRODUCT_LIST,
    tags: [CACHE_TAGS.PRODUCTS, ...(params.category ? [CACHE_TAGS.category(params.category)] : [])],
  });
}

/**
 * Fetch a single product for the detail/ISR page.
 * Revalidates more aggressively — affiliate prices change frequently.
 */
export async function getProduct(slug: string, previewToken?: string): Promise<ApiResponse<ProductDetail>> {
  const qs = previewToken
    ? `site=${SITE_KEY}&fields=${DETAIL_FIELDS}&preview_token=${previewToken}`
    : `site=${SITE_KEY}&fields=${DETAIL_FIELDS}`;
  return apiFetch<ApiResponse<ProductDetail>>(`/products/${slug}?${qs}`, {
    revalidate: REVALIDATION.PRODUCT_DETAIL,
    tags: [CACHE_TAGS.PRODUCTS, CACHE_TAGS.product(slug)],
    noCache: !!previewToken,
  });
}

/**
 * Fetch reviews for a product — always batched, never inside a render loop.
 * Revalidates slowly — review content is less time-sensitive than prices.
 */
export async function getReviews(
  productSlug: string,
  page = 1,
): Promise<PaginatedResponse<Review>> {
  const qs = new URLSearchParams({
    fields: REVIEW_FIELDS,
    page: String(page),
    per_page: '12',
  });

  return apiFetch<PaginatedResponse<Review>>(`/products/${productSlug}/reviews?${qs}`, {
    revalidate: REVALIDATION.REVIEWS,
    tags: [CACHE_TAGS.reviews(productSlug)],
  });
}

/**
 * Batch-fetch multiple products by slug in a SINGLE request.
 *
 * WHY THIS EXISTS: Prevents the N+1 pattern where a "Related Products" component
 * might call getProduct() inside a .map(). Call this once with all slugs instead.
 */
export async function getProductsBySlugs(slugs: string[]): Promise<ProductCard[]> {
  if (slugs.length === 0) return [];

  const qs = new URLSearchParams({ site: SITE_KEY, fields: CARD_FIELDS, slugs: slugs.join(',') });
  const res = await apiFetch<PaginatedResponse<ProductCard>>(`/products?${qs}`, {
    revalidate: REVALIDATION.PRODUCT_DETAIL,
    tags: [CACHE_TAGS.PRODUCTS],
  });

  return res.data;
}

// ── Artisan API ────────────────────────────────────────────────────────────────

/** Paginated list of published artisans for the /artisans grid. */
export async function getArtisans(page = 1): Promise<PaginatedResponse<ArtisanCard>> {
  const qs = new URLSearchParams({ fields: ARTISAN_CARD_FIELDS, page: String(page) });
  return apiFetch<PaginatedResponse<ArtisanCard>>(`/artisans?${qs}`, {
    revalidate: REVALIDATION.ARTISANS,
    tags: [CACHE_TAGS.ARTISANS],
  });
}

/** Full artisan profile for /artisans/[slug]. */
export async function getArtisan(slug: string, previewToken?: string): Promise<ApiResponse<Artisan>> {
  const qs = previewToken
    ? `fields=${ARTISAN_DETAIL_FIELDS}&preview_token=${previewToken}`
    : `fields=${ARTISAN_DETAIL_FIELDS}`;
  return apiFetch<ApiResponse<Artisan>>(`/artisans/${slug}?${qs}`, {
    revalidate: REVALIDATION.ARTISANS,
    tags: [CACHE_TAGS.ARTISANS, CACHE_TAGS.artisan(slug)],
    noCache: !!previewToken,
  });
}

// ── Journal API ────────────────────────────────────────────────────────────────

/** Paginated list of published posts for the /journal grid, optionally filtered by category. */
export async function getJournalPosts(params: PostListParams = {}): Promise<PaginatedResponse<PostCard>> {
  const qs = new URLSearchParams({ 
    fields: POST_CARD_FIELDS, 
    page: String(params.page ?? 1),
    ...(params.category && { category: params.category }),
  });
  
  return apiFetch<PaginatedResponse<PostCard>>(`/journal?${qs}`, {
    revalidate: REVALIDATION.JOURNAL,
    tags: [CACHE_TAGS.JOURNAL, ...(params.category ? [CACHE_TAGS.category(params.category)] : [])],
  });
}

/** Full journal article for /journal/[slug] — includes related products. */
export async function getJournalPost(slug: string, previewToken?: string): Promise<ApiResponse<Post>> {
  const qs = previewToken
    ? `fields=${POST_DETAIL_FIELDS}&preview_token=${previewToken}`
    : `fields=${POST_DETAIL_FIELDS}`;
  return apiFetch<ApiResponse<Post>>(`/journal/${slug}?${qs}`, {
    revalidate: REVALIDATION.JOURNAL,
    tags: [CACHE_TAGS.JOURNAL, CACHE_TAGS.post(slug)],
    noCache: !!previewToken,
  });
}

// ── Categories API ────────────────────────────────────────────────────────────

/**
 * Fetch all categories with active product counts.
 *
 * WHY NOT PAGINATED: The full list (≤20 categories) is always needed for the
 * filter sidebar. A flat array avoids multiple requests for a small dataset.
 * Cached 24h — categories change only when an admin updates taxonomy.
 */
export async function getCategories(): Promise<CategoryWithChildren[]> {
  const res = await apiFetch<{ data: CategoryWithChildren[] }>(`/categories?site=${SITE_KEY}`, {
    revalidate: REVALIDATION.CATEGORIES,
    tags: [CACHE_TAGS.CATEGORIES],
  });
  return res.data;
}

// ── Site Settings API ──────────────────────────────────────────────────────────

/**
 * Fetch all CMS-managed site settings (hero, social links, metadata).
 *
 * WHY 24h TTL: Settings change only when an admin saves via the Filament page.
 * The Laravel side also caches for 24h and busts on save. Matching TTLs means
 * the Next.js ISR cache and the Laravel cache expire together.
 *
 * NEVER call this inside a .map() — call once at the page level and pass down.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const res = await apiFetch<{ data: SiteSettings }>(`/settings?site=${SITE_KEY}`, {
    revalidate: REVALIDATION.SETTINGS,
    tags: [CACHE_TAGS.SETTINGS],
  });
  return res.data;
}

