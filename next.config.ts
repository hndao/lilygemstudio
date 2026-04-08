/**
 * Next.js Configuration — Dariiv.com
 *
 * WHY THESE SETTINGS:
 *  - headers(): HTTP security headers applied at the CDN edge (Vercel). These
 *    don't add any runtime cost — they're sent with every response for free.
 *  - poweredByHeader: false — removes "X-Powered-By: Next.js" to reduce info
 *    leakage about our stack (minor but good hygiene).
 *  - compress: true — gzip/brotli on Node.js responses. Vercel's CDN adds
 *    brotli on top, but this covers self-hosted Octane fallback scenarios.
 *  - images.remotePatterns: Whitelisting prevents SSRF via next/image proxy.
 *  - experimental.optimizePackageImports: Reduces JS bundle — lucide-react
 *    ships 1000+ icons; tree-shaking is critical for LCP.
 *  - reactCompiler: Auto-memoization without manual useMemo calls.
 */
import type { NextConfig } from "next";

// ── Content Security Policy ───────────────────────────────────────────────────
//
// WHY CSP: The single most effective XSS mitigation available. It tells the
// browser exactly which origins are allowed to load scripts, styles, images,
// and make network requests — blocking injected malicious scripts even if
// they somehow reach the page.
//
// DIRECTIVE RATIONALE:
//  - default-src 'self': deny everything not explicitly allowed
//  - script-src 'self' 'unsafe-inline' plausible.io: Next.js requires
//    'unsafe-inline' for hydration scripts and JSON-LD. plausible.io is
//    required for the Plausible analytics script loaded in layout.tsx.
//    A nonce-based approach would be ideal but requires middleware —
//    acceptable trade-off for an affiliate site with no user-generated content.
//  - style-src 'self' 'unsafe-inline': Tailwind v4 injects critical CSS inline
//    at build time; 'unsafe-inline' is required.
//  - img-src: self + data URIs (LQIP blur placeholders) + all image CDNs
//    whitelisted in remotePatterns below.
//  - connect-src: self + API domain + plausible.io. Plausible fires XHR/beacon
//    POSTs to https://plausible.io/api/event for custom event tracking
//    (affiliate clicks, social shares). Without this, trackAffiliateClick()
//    is silently blocked by the browser.
//  - font-src 'self': fonts are self-hosted via next/font — no Google Fonts CDN
//  - frame-ancestors 'none': belt-and-suspenders with X-Frame-Options
//  - base-uri 'self': prevents <base> tag injection attacks
//  - form-action 'self': prevents form hijacking to external domains
const isDev = process.env.NODE_ENV === "development";

const CSP_DIRECTIVES = [
  "default-src 'self'",
  // WHY plausible.io: Plausible analytics script is loaded from plausible.io
  // in layout.tsx. Cloudflare passes CSP headers through unchanged — the
  // browser enforces them, so plausible.io must be explicitly allowed here.
  "script-src 'self' 'unsafe-inline' https://plausible.io",
  "style-src 'self' 'unsafe-inline'",
  [
    "img-src 'self' data: blob:",
    "https://*.amazon.com",
    "https://m.media-amazon.com",
    "https://images.unsplash.com",
    // Cloudflare R2 — custom domain for darliv-media bucket
    "https://media.dariiv.com",
    // Vercel's image optimisation proxy
    "https://*.vercel.app",
  ].join(" "),
  // WHY plausible.io in connect-src: Plausible fires XHR/beacon POSTs to
  // https://plausible.io/api/event for every custom event (affiliate clicks,
  // social shares). Cloudflare proxies our origin headers to the browser
  // unchanged — without this, all custom event tracking is silently dropped.
  // WHY localhost:8000 in dev: local Laravel API runs on http://localhost:8000.
  isDev
    ? "connect-src 'self' http://localhost:8000 https://api.dariiv.com https://plausible.io"
    : "connect-src 'self' https://api.dariiv.com https://plausible.io",
  "font-src 'self'",
  "media-src 'self' https://media.dariiv.com",
  "object-src 'none'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // WHY only in production: upgrade-insecure-requests would block http://localhost
  // in development. In production all traffic is HTTPS so this is safe.
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

// ── HTTP Security Headers ─────────────────────────────────────────────────────
//
// Applied to every route. They cost nothing at runtime and protect against:
//  - Content-Security-Policy: XSS via script injection
//  - X-Frame-Options: clickjacking (embedding our pages in iframes)
//  - X-Content-Type-Options: MIME-sniffing attacks (browser interpreting JS as HTML)
//  - Referrer-Policy: leaking full URL to third-party affiliate networks
//  - Permissions-Policy: disabling unused browser APIs that affiliate scripts
//    could abuse (camera, geolocation, payment)
//  - Strict-Transport-Security: force HTTPS on subsequent visits (HSTS preload)
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy",   value: CSP_DIRECTIVES },
  { key: "X-Frame-Options",           value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "X-DNS-Prefetch-Control",    value: "on" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // WHY these denials: we have zero need for camera/mic/geo — disabling them
    // prevents rogue affiliate SDKs from requesting these APIs.
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    // max-age=63072000 = 2 years (HSTS preload minimum). includeSubDomains
    // covers api.dariiv.com and media.dariiv.com. preload submits us to
    // browser HSTS preload lists.
    //
    // WHY SAFE WITH CLOUDFLARE: Cloudflare also injects its own HSTS header
    // at the edge (when "Always Use HTTPS" is enabled). Having both is
    // harmless — browsers take the longer max-age. Our origin header is
    // forwarded to the browser unchanged by Cloudflare's proxy.
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Remove "X-Powered-By: Next.js" from every response — reduces stack fingerprinting
  poweredByHeader: false,

  // Gzip/brotli compression on the Node.js server — critical for API route responses
  compress: true,

  // ── Redirects ─────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // /catalog (bare) → default language shop
      { source: "/catalog", destination: "/vi/shop", permanent: true },
      // /:lang/catalog → /:lang/shop
      { source: "/:lang/catalog", destination: "/:lang/shop", permanent: true },
    ];
  },

  // ── HTTP Security Headers ─────────────────────────────────────────────────
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
      {
        // Static assets: aggressive long-term caching at the CDN edge.
        // WHY 1 year: next/image content-hashes filenames, so stale cache
        // is impossible — old URLs simply stop being referenced.
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // OG images: short cache so product price/name updates appear on re-share.
        // WHY 1h: matches PRODUCT_DETAIL ISR TTL — consistency is key.
        source: "/api/og/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=3600, stale-while-revalidate=86400" },
        ],
      },
      {
        // Revalidation webhook: never cache — must always reach the origin.
        source: "/api/revalidate",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },

  // ── Image Optimization ────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        // Our Laravel API serving product images
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/storage/**",
      },
      {
        // Production API domain
        protocol: "https",
        hostname: "api.dariiv.com",
        pathname: "/storage/**",
      },
      {
        // Amazon product images (affiliate catalog)
        protocol: "https",
        hostname: "**.amazon.com",
      },
      {
        // Amazon S3 / affiliate CDNs
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        // Artisan product editorial photos
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Cloudflare R2 — media.dariiv.com custom domain (darliv-media bucket)
        // WHY custom domain: end-user never sees r2.cloudflarestorage.com URLs;
        // custom domain is served through Cloudflare's edge cache by default.
        protocol: "https",
        hostname: "media.dariiv.com",
      },
    ],
    // WHY avif first: 50% smaller than WebP at equivalent quality on mobile.
    // Vercel's image optimizer serves the smallest format each browser accepts.
    formats: ["image/avif", "image/webp"],
  },

  // ── Bundle Optimisation ───────────────────────────────────────────────────
  experimental: {
    // Tree-shakes lucide-react + framer-motion at the module level.
    // Without this, Next.js bundles the ENTIRE icon set even if only
    // 5 icons are used — adding ~200KB to the initial JS payload.
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },

  // ── Environment Variables ─────────────────────────────────────────────────
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://dariiv.com",
  },
};

export default nextConfig;
