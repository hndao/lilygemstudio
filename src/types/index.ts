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
  /** AI-generated expert verdict — rendered by ExpertVerdict.tsx */
  verdict?: ProductVerdict;
  /** AI-generated pros/cons — rendered by FeatureAnalysis.tsx */
  pros_cons?: ProductProsCons;
  /** AI-generated content blocks — rendered by BlocksRenderer.tsx */
  blocks?: ProductBlock[];
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
  /** Headline — bilingual. Legacy single-language `title` kept as fallback. */
  title_en?: string;
  title_vi?: string;
  title?: string;          // legacy fallback
  description_en?: string;
  description_vi?: string;
  description?: string;    // legacy fallback
  cta_text_en?: string;
  cta_text_vi?: string;
  cta_text?: string;       // legacy fallback
  cta_url: string;
  cta2_text_en?: string;
  cta2_text_vi?: string;
  cta2_text?: string;      // legacy fallback
  cta2_url?: string;
}

export interface PageAboutContent {
  hero_image_url?: string;
  hero_image_alt?: string;
  hero_label_en?: string;   hero_label_vi?: string;
  hero_title_en?: string;   hero_title_vi?: string;
  hero_body_en?: string;    hero_body_vi?: string;
  hero_cta_shop_en?: string;    hero_cta_shop_vi?: string;
  hero_cta_contact_en?: string; hero_cta_contact_vi?: string;
  stats?: Array<{ value: string; label_en: string; label_vi: string }>;
  process_label_en?: string;   process_label_vi?: string;
  process_heading_en?: string; process_heading_vi?: string;
  process_steps?: Array<{ step: string; title_en: string; title_vi: string; body_en: string; body_vi: string }>;
  values_label_en?: string;   values_label_vi?: string;
  values_heading_en?: string; values_heading_vi?: string;
  values_items?: Array<{ title_en: string; title_vi: string; body_en: string; body_vi: string }>;
  cta_heading_en?: string; cta_heading_vi?: string;
  cta_body_en?: string;    cta_body_vi?: string;
  cta_shop_en?: string;    cta_shop_vi?: string;
  cta_story_en?: string;   cta_story_vi?: string;
}

export interface PageStoryContent {
  hero_image_url?: string;
  hero_image_alt?: string;
  hero_label_en?: string;   hero_label_vi?: string;
  hero_title_en?: string;   hero_title_vi?: string;
  hero_body_en?: string;    hero_body_vi?: string;
  pillars_label_en?: string;   pillars_label_vi?: string;
  pillars_heading_en?: string; pillars_heading_vi?: string;
  pillar_a_title_en?: string;  pillar_a_title_vi?: string;
  pillar_a_body_en?: string;   pillar_a_body_vi?: string;
  pillar_b_title_en?: string;  pillar_b_title_vi?: string;
  pillar_b_body_en?: string;   pillar_b_body_vi?: string;
  philosophy_label_en?: string;   philosophy_label_vi?: string;
  philosophy_heading_en?: string; philosophy_heading_vi?: string;
  philosophy_body_en?: string;    philosophy_body_vi?: string;
  cta_heading_en?: string; cta_heading_vi?: string;
  cta_shop_en?: string;    cta_shop_vi?: string;
  cta_about_en?: string;   cta_about_vi?: string;
}

export interface PageHomeContent {
  hero_image_url?: string;
  hero_image_alt?: string;
  story_label_en?: string;   story_label_vi?: string;
  story_heading_en?: string; story_heading_vi?: string;
  story_body1_en?: string;   story_body1_vi?: string;
  story_body2_en?: string;   story_body2_vi?: string;
  story_body3_en?: string;   story_body3_vi?: string;
  story_cta_en?: string;     story_cta_vi?: string;
}

export interface PageContactContent {
  hero_label_en?: string;   hero_label_vi?: string;
  hero_title_en?: string;   hero_title_vi?: string;
  hero_body_en?: string;    hero_body_vi?: string;
  sidebar_heading_en?: string; sidebar_heading_vi?: string;
  sidebar_body_en?: string;    sidebar_body_vi?: string;
  response_time_en?: string;   response_time_vi?: string;
  form_heading_en?: string;    form_heading_vi?: string;
  form_subheading_en?: string; form_subheading_vi?: string;
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
  pages?: {
    page_about?: PageAboutContent;
    page_story?: PageStoryContent;
    page_contact?: PageContactContent;
    page_home?: PageHomeContent;
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
  /** Filter definitions for the shop sidebar — populated by the category's assigned field definitions */
  filterDefinitions?: FilterDefinition[];
}

// ── Shop filter definitions (from category.filterDefinitions) ────────────────

export interface FilterOptionItem {
  value: string;
  label: string;
  hex?: string | null;
}

export interface FilterDefinition {
  name: string;
  label: string;
  labelVi?: string | null;
  /** 'variant' = backed by product_field_combinations; 'custom_field' = backed by product_field_values */
  source: 'variant' | 'custom_field';
  /** How the filter is rendered in the UI */
  display: 'checkbox' | 'color_swatch' | 'button_grid' | 'text';
  options: FilterOptionItem[];
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

// ── Commerce ───────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  site: string | null;
  isBlocked: boolean;
}

export interface CartItemListing {
  id: number;
  resolvedTitle: string;
  sku: string | null;
  coverImage: ProductImage | null;
  products: { id: number; name: string }[];
}

export interface CartItem {
  id: number;
  listingId: number;
  quantity: number;
  priceSnapshotCents: number | null;
  priceSnapshotCentsVnd: number | null;
  selectedOptions: Record<string, string>;
  outOfStock: boolean;
  listing: CartItemListing;
}

export interface CartCoupon {
  code: string;
  type: string;
  value: number;
  discountCents: number;
}

export interface Cart {
  id: number;
  sessionToken: string | null;
  items: CartItem[];
  coupon: CartCoupon | null;
  subtotalCents: number;
  subtotalCentsVnd: number;
  itemCount: number;
}

export interface Address {
  id: number;
  label: string | null;
  recipientName: string;
  phone: string | null;
  email: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  countryCode: string;
  isDefault: boolean;
}

export interface AddressInput {
  recipient_name: string;
  phone?: string;
  email?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country_code: string;
  label?: string;
  is_default?: boolean;
}

export interface ShippingRate {
  id: number;
  name: string;
  rateCents: number;
  estimatedDaysMin: number | null;
  estimatedDaysMax: number | null;
  minOrderCents: number | null;
}

export interface OrderItem {
  id: number;
  listingId: number;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  listingSnapshot: {
    id: number;
    slug?: string;
    resolvedTitle: string;
    price_cents: number;
    price_cents_vnd: number | null;
    cover_image: ProductImage | null;
    sku: string | null;
    platforms: string[];
    bundleProducts: { id: number; name: string; pivotQuantity: number }[];
  };
}

export interface OrderShipment {
  trackingNumber: string | null;
  carrier: string | null;
  shippedAt: string | null;
  estimatedDelivery: string | null;
}

export interface OrderStatusHistory {
  status: string;
  note: string | null;
  createdAt: string | null;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: string;
  currency: string;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  formattedTotal: string;
  couponCode: string | null;
  shippingAddress: Omit<Address, 'id' | 'isDefault' | 'label'>;
  notes: string | null;
  paidAt: string | null;
  createdAt: string;
  items: OrderItem[];
  payment: { provider: string; status: string; paidAt: string | null } | null;
  shipment: OrderShipment | null;
  statusHistories: OrderStatusHistory[];
}

export interface ListingCard {
  id: number;
  slug: string;
  title: string | null;
  resolvedTitle: string;
  sku: string | null;
  platforms: string[];
  platformLinks: { platform: string; url: string }[];
  formattedPrice: string | null;
  formattedCompareAtPrice: string | null;
  formattedPriceVnd: string | null;
  formattedCompareAtPriceVnd: string | null;
  priceCents: number | null;
  priceCentsVnd: number | null;
  comparePriceCents: number | null;
  comparePriceCentsVnd: number | null;
  coverImage: ProductImage | null;
  quantity: number | null;
  isLive: boolean;
  /** False when one or more bundle products have is_active=false. Show "Out of Stock". */
  productsActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
  bundleProducts: {
    id: number;
    name: string;
    slug: string;
    pivotQuantity: number;
    options: {
      slug: string;
      name: string;
      displayType: 'color_swatch' | 'text_pill' | 'image_swatch' | 'dropdown';
      values: { slug: string; label: string; metadata: Record<string, string> }[];
    }[];
  }[];
  /** Present when fetched via detail endpoint (showBySlug / show) */
  images?: ProductImage[];
  description?: string | null;
  descriptionVi?: string | null;
  titleVi?: string | null;
  tagline?: string | null;
  taglineVi?: string | null;
  /** Social proof — from first bundle product's review aggregates */
  averageRating?: number | null;
  reviewCount?: number | null;
  /** Merchandising badges attached in admin — max 3, ordered by priority */
  badges?: ListingBadge[];
}

export interface ListingBadge {
  id: number;
  name: string;
  group: 'promotion' | 'status' | 'trust' | 'shipping' | 'exclusive';
  color: string;      // hex background — "#DC2626"
  textColor: string;  // hex text — "#FFFFFF"
  expiresAt?: string | null; // ISO 8601 — null = no expiry; set for Flash Sale, Pre-order, etc.
}

export interface ListingListParams {
  page?: number;
  perPage?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  platform?: string;
  query?: string;
  category?: string;
  badge?: string;
  /** Price range filter — integer cents (USD) or đồng (VND) */
  priceMin?: number;
  priceMax?: number;
  priceCurrency?: 'usd' | 'vnd';
  /** Only show listings with available stock */
  inStock?: boolean;
  /** Arbitrary field slug → value filters (e.g. { stone_type: 'agate', color: 'gold' }) */
  customFilters?: Record<string, string>;
  /**
   * Used client-side only — tells getListings() which customFilter keys should be
   * routed to the variant_fields query param (combination-based) vs spec-based.
   * Derived from the category's filterDefinitions.
   */
  filterDefinitions?: FilterDefinition[];
}

export interface CheckoutPayload {
  currency: 'USD' | 'VND';
  shipping_rate_cents: number;
  shipping_address: AddressInput;
  notes?: string;
}

// ── In-App Notification ────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  type: string;
  message: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

