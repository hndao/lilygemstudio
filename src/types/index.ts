/**
 * DARIIV — Canonical TypeScript Interfaces
 *
 * WHY SELECTIVE FIELDS: Every interface here mirrors exactly what the UI renders.
 * We never request more columns than this from the API (no SELECT *). Smaller
 * payloads = faster serialization, smaller RSC streaming chunks, lower TTFB.
 *
 * RULE: If a field is not in this file, it must NOT appear in any fetch call.
 */

// ── Primitive building blocks ──────────────────────────────────────────────────

export interface Money {
  amount: number;        // integer cents — avoids float precision bugs
  currency: 'USD' | 'CAD';
  formatted: string;     // pre-formatted by API: "$49.99" — no client-side Intl needed
}

export interface AffiliateLink {
  url: string;
  network: 'amazon' | 'shareasale' | 'cj' | 'rakuten' | 'direct';
  /** FTC disclosure is enforced at the component layer — flag here for audit scans */
  requiresDisclosure: true;
}

export interface ProductImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  blurDataURL?: string;  // base64 LQIP — eliminates CLS during image load
  /** Optional tag for color-based gallery filtering — matches ColorOption.image_tags */
  tag?: string;
}

// ── Review (lean shape — list context) ────────────────────────────────────────

/** Used in product grids, carousels — minimal fields only */
export interface ReviewSummary {
  averageRating: number;   // 1–5, one decimal place
  totalCount: number;
}

/** Full review — used on product detail page */
export interface Review {
  id: string;
  authorName: string;
  rating: number;          // 1–5 integer
  title: string;
  body: string;
  verifiedPurchase: boolean;
  images: Pick<ProductImage, 'src' | 'alt' | 'width' | 'height'>[];
  publishedAt: string;     // ISO 8601 — formatted in component via Intl.DateTimeFormat
}

// ── Product metadata (flexible specs + AI-generated SEO) ──────────────────────

/** schema_data is injected into JSON-LD Product schema (category → @type, material → material) */
export interface ProductSchemaData {
  category: string;   // e.g. "Home Security" — maps to Product.category in JSON-LD
  material: string;   // e.g. "Agate, Stainless Steel" — maps to Product.material
}

// ── Custom field types (category-driven product attributes) ───────────────────

/** Value shape for a single-color field (multiple: false or absent) */
export interface ColorFieldValue {
  name: string;  // e.g. "Gold"
  hex: string;   // e.g. "#FFD700"
}

/**
 * Value shape for one option inside a multi-color field (multiple: true).
 * slug is the stable URL key used in ?color= params and cart selected_options.
 */
export interface ColorOption {
  name: string;           // "Amber honey"
  slug: string;           // "amber-honey" — stable URL + cart key
  hex: string;            // primary swatch hex
  hex_secondary?: string; // second hex for gradient swatch; absent = solid circle
  in_stock?: boolean;     // default true; false = swatch dimmed + disabled
  image_tags?: string[];  // filters gallery to images whose tag matches any value here
}

/** A single custom field definition set on a Category — drives the product edit form and frontend display */
export interface CustomFieldDefinition {
  name: string;                                    // snake_case key stored in custom_fields JSON
  label: string;                                   // human-readable UI label
  type: 'text' | 'number' | 'boolean' | 'color';
  unit?: string;                                   // only present for type=number (e.g. "mm", "cm")
  group?: string;                                  // grouping label used for section headers
  required?: boolean;
  /** Only for type=color. When true, value is ColorOption[] (multi-swatch picker). Default false. */
  multiple?: boolean;
  /** Controls render zone on the product detail page. Default "specs_box". */
  display_position?: 'above_cart' | 'specs_box' | 'below_specs' | 'hidden';
  /** Populated at render time for single color fields — hex used to draw the swatch dot in SpecsBox */
  hex?: string;
}

/** A resolved field definition paired with its product value — used by SpecsBox / page assembly */
export interface FieldWithValue {
  definition: CustomFieldDefinition;
  value: string | number | boolean;
}

export interface SeoMeta {
  meta_title: string;        // ≤60 chars — AI-written, includes brand name
  meta_description: string;  // ≤155 chars — search-snippet with keyword + CTA
  keywords?: string[];
}

export interface ProductSeoMeta extends SeoMeta {
  schema_data?: ProductSchemaData;
}

export interface ProductMetadata {
  seo?: ProductSeoMeta;
  origin?: string;           // artisan provenance — used as Brand in JSON-LD
  imported_from?: string;
  import_date?: string;
  [key: string]: unknown;    // allows arbitrary key-value pairs from Filament
}

// ── AI-generated product enrichment (Gemini JSON schema) ──────────────────────

/**
 * Expert verdict block — rendered by ExpertVerdict.tsx on the product page.
 * Generated by Gemini via AiContentCurator::buildPrompt().
 */
export interface ProductVerdict {
  summary: string;    // 2-sentence "Why We Recommend This"
  score: number;      // 0–5 decimal (e.g. 4.8)
  ideal_for: string;  // persona description — shown as a badge
}

/** Objective pros/cons split — rendered by FeatureAnalysis.tsx */
export interface ProductProsCons {
  pros: string[];     // 3 functional/aesthetic/emotional benefits
  cons: string[];     // 2 honest limitations (max)
}

// ── Product content blocks (AI-generated, discriminated union) ─────────────────

export interface HeroBlockData {
  headline: string;      // ≤60 chars — conversion-oriented
  subheadline: string;   // ≤100 chars — emotional support line
  body: string;          // expanded value proposition
}

export interface SpecTableBlockData {
  heading: string;                              // e.g. "Technical Soul"
  specs: Array<{ label: string; value: string }>;
}

export interface SplitProductBlockData {
  heading: string;
  body: string;
  image_position: 'left' | 'right';
}

/**
 * ProductBlock — discriminated union of AI-generated content block types.
 * Rendered by BlocksRenderer.tsx. Separate from the journal ContentBlock
 * union (which is Filament-driven and has src/width/height for images).
 */
export type ProductBlock =
  | { type: 'hero';       data: HeroBlockData }
  | { type: 'spec_table'; data: SpecTableBlockData }
  | { type: 'split';      data: SplitProductBlockData };

// ── Product (two shapes: list vs detail) ──────────────────────────────────────

/**
 * WHY TWO SHAPES: The grid view never needs brand_story, full description, or
 * related products. Fetching them for 24 grid cards = 24× wasted bytes.
 * ProductCard gets the lean shape; ProductDetail gets the full shape.
 */
// ── Customer (storefront auth) ─────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface ProductCard {
  id: string;
  slug: string;
  name: string;
  nameVi?: string;           // Tiếng Việt translation (LilyGemStudio only)
  tagline: string;          // one-line hook for grid cards
  taglineVi?: string;
  price: Money;
  compareAtPrice?: Money;   // crossed-out original price (sale indicator)
  priceVnd?: Money;
  compareAtPriceVnd?: Money;
  coverImage: ProductImage;
  affiliateLink: AffiliateLink;
  affiliateLinkVn?: AffiliateLink;
  reviewSummary: ReviewSummary;
  badge?: 'new' | 'bestseller' | 'sale' | 'limited';
  /** null = unlimited / not tracked; 0 = out of stock; >0 = available quantity */
  quantity?: number | null;
  /** Total number of likes from all customers */
  likesCount?: number;
  /** Full CDN URL for the product demo/review video — null when no video uploaded */
  videoUrl?: string;
}

export interface ProductDetail extends ProductCard {
  description: string;      // full markdown/HTML description
  descriptionVi?: string;
  brandStory: string;       // artisan origin story
  brandStoryVi?: string;
  images: ProductImage[];   // full gallery (cover + extras)
  category: { slug: string; name: string; nameVi?: string };
  /** All categories this product belongs to (many-to-many) — used for display and filter links */
  categories?: Array<{ id: string; slug: string; name: string; nameVi?: string }>;
  tags: string[];
  metadata: ProductMetadata; // specs + AI-generated SEO fields (seo.meta_title, seo.meta_description, seo.keywords)
  /** Category-driven custom fields — key/value pairs defined per category (specs, affiliate data, SEO signals) */
  customFields?: Record<string, string | number | boolean | ColorFieldValue | ColorOption[]>;
  /** Field definitions from the assigned category — used to display labels, units, groups, and color swatches */
  customFieldDefinitions?: CustomFieldDefinition[];
  artisan?: ArtisanCard;    // optional — not all products have an artisan profile
  /** AI-generated expert verdict — rendered by ExpertVerdict.tsx */
  verdict?: ProductVerdict;
  /** AI-generated pros/cons — rendered by FeatureAnalysis.tsx */
  pros_cons?: ProductProsCons;
  /** AI-generated content blocks — rendered by BlocksRenderer.tsx */
  blocks?: ProductBlock[];
}

// ── Artisan (two shapes: card vs full profile) ────────────────────────────────

/**
 * WHY TWO SHAPES: The artisan grid only needs avatar + name + location + bio.
 * The full profile page needs all three story sections. Same pattern as Product.
 */
export interface ArtisanCard {
  id: string;
  slug: string;
  name: string;
  location: string;
  avatar: ProductImage;     // square image — reuses ProductImage shape
  bioShort: string;
  productCount?: number;    // present on list endpoint, absent when embedded in ProductDetail
}

export interface Artisan extends ArtisanCard {
  coverImage: ProductImage; // wide hero image for the profile page
  storyOrigin: string;      // Markdown — "Where I come from"
  storyCraft: string;       // Markdown — "How I make things"
  storyPhilosophy: string;  // Markdown — "Why I make things"
  publishedAt: string;      // ISO 8601
  products: ProductCard[];  // artisan's active products
}

// ── Journal / Blog (two shapes: card vs full article) ────────────────────────

export interface PostCard {
  id: string;
  slug: string;
  title: string;
  category: string;         // free-text label: "Craft", "Lifestyle", "Gift Guide", etc.
  featuredImage: ProductImage;
  publishedAt: string;      // ISO 8601
}

// ── Content Block types — mirrors Filament Builder output ─────────────────────

/**
 * WHY DISCRIMINATED UNION: Each block type has a different `data` shape.
 * TypeScript narrows the type correctly when you switch on `block.type`,
 * giving full IDE autocomplete and eliminating "property may not exist" errors.
 */
export interface TextBlockData {
  html: string;             // Safe HTML from TipTap text-block profile
}

export interface ImageBlockData {
  src: string;              // Full CDN URL — resolved by PostResource before delivery
  alt: string;              // Required for SEO + accessibility
  title?: string;           // Browser tooltip
  caption?: string;         // Rendered as <figcaption>
  alignment: 'left' | 'center' | 'right' | 'full';
  width: number;
  height: number;
}

export interface SplitBlockData {
  html: string;             // Text column — safe HTML from text-block TipTap profile
  src: string;              // Image CDN URL
  alt: string;
  title?: string;
  caption?: string;
  image_position: 'left' | 'right';
  width: number;
  height: number;
}

export interface FaqSchemaItem {
  question: string;
  answer: string;
}

export interface FaqSchemaBlockData {
  items: FaqSchemaItem[];
}

export interface TocBlockData {
  title?: string;        // Box heading — e.g. "What You'll Learn in This Guide"
  description?: string;  // Optional sub-heading below the title
  // items are NOT stored — auto-extracted from <h2> headings in text blocks at render time
}

export type ContentBlock =
  | { type: 'text';       data: TextBlockData }
  | { type: 'image';      data: ImageBlockData }
  | { type: 'split';      data: SplitBlockData }
  | { type: 'faq_schema'; data: FaqSchemaBlockData }
  | { type: 'toc';        data: TocBlockData };

export interface Post extends PostCard {
  subtitle?: string;                // optional italic tagline below the title
  blocks: ContentBlock[];           // structured block array — replaces flat `content`
  seo?: SeoMeta;                    // AI-generated SEO fields
  // Internal Linking (Silo) — raw IDs always present; expanded objects pre-fetched by controller
  relatedProductIds: string[];      // raw product ID strings stored by Filament TagsInput
  relatedPostIds: number[];         // raw post IDs stored by Filament Select
  relatedProducts: ProductCard[];   // pre-fetched by API — never fetched inside .map()
  relatedPosts: PostCard[];         // Internal linking cluster for Silo architecture
}

// ── Site Settings ─────────────────────────────────────────────────────────────

/** One slide in the hero carousel or single-image hero */
export interface HeroSlide {
  image_url: string;
  image_alt: string;
  /** Headline — may contain \n to split into two lines */
  title: string;
  description: string;
  cta_text: string;
  cta_url: string;
  /** Optional secondary (outline) CTA — omit or leave blank to hide */
  cta2_text?: string;
  cta2_url?: string;
}

export interface SiteSettings {
  site: {
    site_name: string;
    site_tagline: string;
    site_description: string;
    site_keywords: string;
    contact_email: string;
    support_email: string;
  };
  branding: {
    logo_url: string;
    favicon_url: string;
  };
  social: {
    social_instagram: string;
    social_facebook: string;
    social_twitter: string;
    social_pinterest: string;
    social_zalo?: string;
    social_messenger?: string;
    social_youtube: string;
  };
  hero: {
    hero_mode: 'single' | 'slider';
    hero_slides: HeroSlide[];
  };
}

// ── Category ──────────────────────────────────────────────────────────────────

/** Leaf-level category (child or standalone parent with no children) */
export interface Category {
  id: string;
  name: string;
  nameVi?: string;          // Tiếng Việt translation
  slug: string;
  productCount: number;
}

/**
 * Top-level category with optional children.
 * Returned by GET /api/v1/categories — always nested, never flat.
 *
 * WHY SEPARATE TYPE: The API always returns the nested shape. Using a distinct
 * type prevents callers from accidentally treating a parent as a leaf category.
 */
export interface CategoryWithChildren extends Category {
  children: Category[];
}

// ── API response envelope ──────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

export interface ApiResponse<T> {
  data: T;
}

// ── Query param types — prevents typos in fetch call sites ────────────────────

export interface ProductListParams {
  page?: number;
  perPage?: number;
  category?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'top_rated';
  badge?: ProductCard['badge'];
}

export interface PostListParams {
  page?: number;
  category?: string;
}

