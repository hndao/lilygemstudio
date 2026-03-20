/**
 * DARIIV — FTC Compliance Utilities
 *
 * WHY A DEDICATED MODULE: The FTC's 16 CFR Part 255 requires "clear and
 * conspicuous" disclosure of material connections (affiliate commissions)
 * near every affiliate link. Centralising the rel attributes and disclosure
 * text here means a single PR can update legal copy site-wide — no grep
 * needed across 20+ components.
 *
 * REQUIRED ATTRIBUTES on every affiliate <a> tag:
 *  - rel="noopener": prevents the affiliate page from accessing window.opener
 *    (security — stops tab-napping attacks from affiliate sites)
 *  - rel="noreferrer": strips the Referer header so our full URL path isn't
 *    leaked to the affiliate network's analytics
 *  - rel="sponsored": signals to Google that this is a paid/affiliate link,
 *    preventing PageRank manipulation penalties (Google's link spam policy)
 *  - target="_blank": opens in new tab — keeps the user on DARIIV while
 *    they browse the affiliate product page
 */

// ── Affiliate Link Attributes ─────────────────────────────────────────────────

/** Spread onto every <a> that points to an affiliate URL. */
export const AFFILIATE_LINK_PROPS = {
  // nofollow  — tells crawlers not to follow / pass PageRank to affiliate sites
  // noopener  — prevents affiliate page accessing window.opener (tab-napping)
  // noreferrer — strips Referer header so full URL path isn't leaked
  // sponsored  — Google's preferred signal for paid/affiliate links (link spam policy)
  rel: "nofollow noopener noreferrer sponsored" as const,
  target: "_blank" as const,
} satisfies React.AnchorHTMLAttributes<HTMLAnchorElement>;

/** The rel string alone — for cases where you need just the attribute value. */
export const AFFILIATE_LINK_REL = AFFILIATE_LINK_PROPS.rel;

// ── FTC Disclosure Text ───────────────────────────────────────────────────────
//
// WHY SINGLE SOURCE: The FTC can audit any page. If disclosure text drifts
// between components, we risk inconsistent compliance. One constant = one truth.
//
// WHY NETWORK-SPECIFIC: Amazon Associates Program Operating Agreement (Section 5)
// mandates the EXACT phrase "As an Amazon Associate, I earn from qualifying
// purchases." — no paraphrasing allowed. Other networks have their own requirements.

export const FTC_DISCLOSURE_TEXT =
  "DARIIV earns a commission when you buy through our links.";

export const FTC_DISCLOSURE_TEXT_LONG =
  "As an affiliate partner, DARIIV may earn a commission when you purchase " +
  "through links on this page. This comes at no additional cost to you and " +
  "helps us continue curating quality artisan products.";

/**
 * Network-specific FTC/program disclosure text.
 *
 * Amazon: exact wording required by Amazon Associates Operating Agreement §5.
 * Others: FTC 16 CFR §255.5 compliant generic phrasing per network.
 */
export const NETWORK_DISCLOSURE_TEXT: Record<string, string> = {
  amazon:     "As an Amazon Associate, I earn from qualifying purchases.",
  shareasale: "DARIIV earns a commission through ShareASale when you purchase through our links.",
  cj:         "DARIIV earns a commission through CJ Affiliate when you purchase through our links.",
  rakuten:    "DARIIV earns a commission through Rakuten when you purchase through our links.",
  direct:     "DARIIV may earn a commission when you purchase through our links.",
};

/**
 * Returns the correct FTC disclosure text for a given affiliate network.
 * Falls back to the generic text for unknown networks.
 */
export function getNetworkDisclosureText(network: string): string {
  return NETWORK_DISCLOSURE_TEXT[network] ?? FTC_DISCLOSURE_TEXT;
}

// ── Compliance Checklist (for code review reference) ─────────────────────────
//
// Every page that contains an affiliate link MUST have:
//  1. <AffiliateDisclosure variant="inline" /> directly below the CTA button
//  2. The affiliate <a> tag must spread AFFILIATE_LINK_PROPS
//  3. <AffiliateDisclosure variant="footer" /> in the site Footer (global)
//
// Pages currently compliant:
//  ✅ /shop/[slug]/page.tsx — inline disclosure below "Shop Now" CTA
//  ✅ Footer.tsx — footer disclosure in every page's footer bar
//  ✅ ProductCard.tsx — links to /shop/[slug] (not directly to affiliate URL),
//     so no per-card disclosure needed; disclosure fires on the detail page

