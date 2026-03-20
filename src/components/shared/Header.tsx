'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { MobileMenu } from './MobileMenu';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { Locale } from '@/middleware';
import type { Dictionary } from '@/lib/i18n';

interface HeaderProps {
  dict: Dictionary;
  lang: Locale;
}

export function Header({ dict, lang }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const base = `/${lang}`;

  const NAV_LINKS = [
    { href: base, label: dict.nav.home },
    { href: `${base}/shop`, label: dict.nav.shop },
    { href: `${base}/about`, label: dict.nav.about },
    { href: `${base}/contact`, label: dict.nav.contact },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={[
          'sticky top-0 z-30 w-full bg-(--color-stone) transition-shadow duration-200',
          scrolled ? 'shadow-[0_2px_16px_rgba(0,0,0,0.18)]' : '',
        ].join(' ')}
      >
        <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-4 md:px-6 lg:px-8">

          {/* ── Logo ─────────────────────────────────────────────────── */}
          <Link
            href={base}
            className="font-heading text-xl font-bold tracking-tight text-(--color-cream) transition-opacity hover:opacity-80"
            aria-label="LilyGem Studio — Home"
          >
            🌸 LilyGem
          </Link>

          {/* ── Desktop nav (≥ 1280px) ───────────────────────────────── */}
          <nav className="hidden xl:flex items-center gap-8" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-heading text-sm font-600 text-(--color-sand) transition-colors hover:text-(--color-cream)"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ── Right-side: Lang switcher + Hamburger ────────────────── */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher currentLang={lang} dict={dict} />
            <button
              onClick={() => setMenuOpen(true)}
              className="xl:hidden flex items-center justify-center rounded-md p-2 text-(--color-sand) transition-colors hover:bg-white/10 hover:text-(--color-cream)"
              aria-label={dict.header.open_menu}
              aria-expanded={menuOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} dict={dict} lang={lang} />
    </>
  );
}
