'use client';

/**
 * CookieBanner — GDPR & CCPA/CPRA compliant consent banner.
 *
 * COMPLIANCE NOTES:
 *  - GDPR (EU/UK): opt-in required for non-necessary cookies. We show the
 *    banner to ALL users (no geo-detection) and block analytics/marketing
 *    until explicit consent is given. This is the most robust approach.
 *  - CCPA/CPRA (California): opt-out model. We fire the "Do Not Sell" flow
 *    via the DoNotSellButton in the Footer which opens this modal.
 *  - GPC (Global Privacy Control): automatically detected on mount. If the
 *    browser signals GPC, marketing cookies are set to false regardless of
 *    any stored consent — legally required under CCPA since Jan 2024.
 *
 * ARCHITECTURE:
 *  - Listens for the `dariiv:openCookiePreferences` custom event so the
 *    "Do Not Sell" footer button can open the modal without prop-drilling.
 *  - Renders null (no DOM nodes) once consent is stored and GPC is handled.
 */

import { useCallback, useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';
import {
  ACCEPT_ALL,
  ConsentChoices,
  DENY_ALL,
  hasGPC,
  readConsent,
  writeConsent,
} from '@/lib/cookieConsent';
import { CookiePreferencesModal } from './CookiePreferencesModal';

type BannerState = 'hidden' | 'banner' | 'modal';

export function CookieBanner() {
  const [state, setState] = useState<BannerState>('hidden');
  const [choices, setChoices] = useState<ConsentChoices>(DENY_ALL);
  // Track if we've mounted to avoid SSR mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = readConsent();

    // GPC: override marketing regardless of stored preference
    if (hasGPC() && stored) {
      if (stored.marketing) {
        writeConsent({ ...stored, marketing: false });
      }
      return; // Already consented (just adjusted for GPC), no banner needed
    }

    if (!stored) {
      // GPC auto-deny marketing
      const initial = hasGPC()
        ? { ...DENY_ALL, marketing: false }
        : DENY_ALL;
      setChoices(initial);
      // Small delay so the page renders first before banner slides up
      const t = setTimeout(() => setState('banner'), 600);
      return () => clearTimeout(t);
    }

    setChoices({
      analytics: stored.analytics,
      marketing: stored.marketing,
      preferences: stored.preferences,
    });
    // No banner needed — user already consented
  }, []);

  // Listen for "Do Not Sell" button in footer or any other trigger
  const openModal = useCallback(() => setState('modal'), []);
  useEffect(() => {
    window.addEventListener('dariiv:openCookiePreferences', openModal);
    return () => window.removeEventListener('dariiv:openCookiePreferences', openModal);
  }, [openModal]);

  function handleAcceptAll() {
    writeConsent(ACCEPT_ALL);
    setChoices(ACCEPT_ALL);
    setState('hidden');
  }

  function handleRejectAll() {
    writeConsent(DENY_ALL);
    setChoices(DENY_ALL);
    setState('hidden');
  }

  if (!mounted) return null;
  if (state === 'hidden') return null;

  return (
    <>
      {/* ── Bottom banner ── */}
      {state === 'banner' && (
        <div
          role="region"
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-[80px] md:bottom-0 z-40 animate-[slideUp_0.35s_ease-out] border-t border-(--color-border) bg-white/95 shadow-[0_-8px_32px_rgba(0,0,0,0.10)] backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:gap-6 md:px-6 lg:px-8">
            {/* Icon + copy */}
            <div className="flex items-start gap-3 md:flex-1">
              <Cookie
                className="mt-0.5 h-5 w-5 shrink-0 text-(--color-sage)"
                aria-hidden="true"
              />
              <p className="text-sm leading-relaxed text-(--color-muted)">
                <span className="font-heading font-600 text-(--color-stone)">
                  We use cookies.{' '}
                </span>
                Essential cookies are always on. Analytics &amp; marketing
                cookies help us improve the experience — we never sell your
                personal data.{' '}
                <a
                  href="/privacy"
                  className="underline underline-offset-2 transition-colors hover:text-(--color-stone)"
                >
                  Privacy Policy
                </a>
              </p>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                onClick={() => setState('modal')}
                className="rounded-full border border-(--color-border) px-4 py-2 font-heading text-xs font-600 text-(--color-muted) transition-colors hover:border-(--color-stone) hover:text-(--color-stone)"
              >
                Manage Preferences
              </button>
              <button
                onClick={handleRejectAll}
                className="rounded-full border border-(--color-border) px-4 py-2 font-heading text-xs font-600 text-(--color-stone) transition-colors hover:bg-(--color-sand)/40"
              >
                Reject All
              </button>
              <button
                onClick={handleAcceptAll}
                className="rounded-full bg-(--color-sage) px-5 py-2 font-heading text-xs font-600 text-white shadow-sm transition-colors hover:bg-(--color-sage-dark)"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preferences modal (opens from banner OR "Do Not Sell" button) ── */}
      <CookiePreferencesModal
        open={state === 'modal'}
        choices={choices}
        onChoicesChange={setChoices}
        onClose={() => setState(readConsent() ? 'hidden' : 'banner')}
        onSave={() => setState('hidden')}
      />
    </>
  );
}

