'use client';

/**
 * LanguageSwitcher — switches between EN and VI locales.
 * Sets a cookie so the middleware remembers the user's preference.
 */

import { useRouter, usePathname } from 'next/navigation';
import type { Locale } from '@/middleware';
import { SUPPORTED_LOCALES } from '@/middleware';
import type { Dictionary } from '@/lib/i18n';

interface LanguageSwitcherProps {
  currentLang: Locale;
  dict: Dictionary;
}

export function LanguageSwitcher({ currentLang, dict }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(locale: Locale) {
    if (locale === currentLang) return;

    // Set cookie so middleware remembers the preference
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;

    // Replace current locale prefix in the URL
    const segments = pathname.split('/');
    segments[1] = locale; // replace [lang] segment
    router.push(segments.join('/'));
  }

  return (
    <div className="flex items-center gap-1" aria-label="Language switcher">
      {SUPPORTED_LOCALES.map((locale) => (
        <button
          key={locale}
          onClick={() => switchLocale(locale)}
          aria-pressed={locale === currentLang}
          className={[
            'rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide transition-all',
            locale === currentLang
              ? 'bg-(--color-cream) text-(--color-stone)'
              : 'text-(--color-sand)/60 hover:text-(--color-cream)',
          ].join(' ')}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
