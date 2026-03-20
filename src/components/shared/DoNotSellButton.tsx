'use client';

/**
 * DoNotSellButton — CCPA/CPRA "Do Not Sell or Share My Personal Information"
 *
 * WHY THIS EXISTS: California law (CPRA, effective Jan 1 2023) requires that
 * businesses provide a clear and conspicuous link titled
 * "Do Not Sell or Share My Personal Information" if they sell or share
 * personal data (which affiliate tracking pixels do).
 *
 * This button dispatches a custom event to open the CookieBanner's preferences
 * modal (which controls the marketing cookie toggle) — keeping the two
 * components loosely coupled with no shared state or prop drilling.
 */

import { openCookiePreferences } from '@/lib/cookieConsent';

interface Props {
  className?: string;
}

export function DoNotSellButton({ className }: Props) {
  return (
    <button
      type="button"
      onClick={openCookiePreferences}
      className={className}
    >
      Do Not Sell or Share My Personal Information
    </button>
  );
}

