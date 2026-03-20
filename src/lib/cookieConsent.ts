/**
 * cookieConsent.ts — GDPR & CCPA/CPRA consent utilities.
 *
 * ARCHITECTURE:
 *  - Consent is stored in localStorage as a versioned JSON object.
 *  - Version field lets us invalidate old consent records when we add new
 *    cookie categories, forcing users to re-consent.
 *  - GPC (Global Privacy Control) detection: if the user's browser signals GPC,
 *    we automatically deny the "marketing" category — legally required for
 *    CCPA compliance in California as of Jan 2024.
 *
 * CATEGORIES:
 *  - necessary   → always true (session, CSRF). Cannot be disabled.
 *  - analytics   → opt-in. Page views, performance metrics.
 *  - marketing   → opt-in. Affiliate pixels (Meta, Pinterest, TikTok).
 *  - preferences → opt-in. Recently-viewed, filter memory.
 */

export const CONSENT_STORAGE_KEY = 'dariiv_cookie_consent';

/**
 * Bump this whenever a new category is added or an existing category changes
 * its purpose — users with an older version will be re-prompted.
 */
export const CONSENT_VERSION = '1';

export interface CookieConsent {
  version: string;
  necessary: true;       // always true — cannot be toggled off
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: string;     // ISO 8601 — for compliance audit trail
}

/** Partial form used when saving (version + timestamp are injected automatically). */
export type ConsentChoices = Pick<
  CookieConsent,
  'analytics' | 'marketing' | 'preferences'
>;

export const DENY_ALL: ConsentChoices = {
  analytics: false,
  marketing: false,
  preferences: false,
};

export const ACCEPT_ALL: ConsentChoices = {
  analytics: true,
  marketing: true,
  preferences: true,
};

/** Cookie category metadata for display in the preferences modal. */
export interface CookieCategory {
  key: keyof ConsentChoices;
  label: string;
  description: string;
  required: false;
}

export const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    key: 'analytics',
    label: 'Analytics',
    description:
      'Help us understand which products and pages are most useful. Data is aggregated and never sold.',
    required: false,
  },
  {
    key: 'marketing',
    label: 'Marketing & Affiliate Tracking',
    description:
      'Enables affiliate attribution (e.g. Pinterest, TikTok) so we can earn a small commission at no cost to you. Opting out does not affect prices.',
    required: false,
  },
  {
    key: 'preferences',
    label: 'Preferences',
    description:
      'Remembers your recently-viewed products, saved filters, and display preferences.',
    required: false,
  },
];

// ── Storage helpers ───────────────────────────────────────────────────────────

/** Read stored consent. Returns null if not set or if the version is stale. */
export function readConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    // Invalidate stale versions → user must re-consent
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Persist consent choices. Injects version + ISO timestamp automatically. */
export function writeConsent(choices: ConsentChoices): CookieConsent {
  const full: CookieConsent = {
    ...choices,
    necessary: true,
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(full));
  // Notify other tabs / listeners
  window.dispatchEvent(new Event('dariiv:consentUpdated'));
  return full;
}

// ── GPC (Global Privacy Control) ─────────────────────────────────────────────

/**
 * Returns true if the browser is sending the GPC signal.
 * Per CCPA/CPRA regulations, a GPC signal MUST be honoured as an opt-out
 * of the sale/sharing of personal information (marketing category).
 * @see https://globalprivacycontrol.org/
 */
export function hasGPC(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    (navigator as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl === true
  );
}

// ── Custom event helpers ──────────────────────────────────────────────────────

/** Dispatch from any component to programmatically open the preferences modal. */
export function openCookiePreferences() {
  window.dispatchEvent(new Event('dariiv:openCookiePreferences'));
}

