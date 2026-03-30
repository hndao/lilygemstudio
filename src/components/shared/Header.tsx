'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, ShoppingBag, Search, UserCircle, X, LogOut, Package, MapPin, User } from 'lucide-react';
import { MobileMenu } from './MobileMenu';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import type { Locale } from '@/middleware';
import type { Dictionary } from '@/lib/i18n';

interface HeaderProps {
  dict: Dictionary;
  lang: Locale;
}

export function Header({ dict, lang }: HeaderProps) {
  const [menuOpen, setMenuOpen]         = useState(false);
  const [scrolled, setScrolled]         = useState(false);
  const [profileOpen, setProfileOpen]   = useState(false);
  const [searchOpen, setSearchOpen]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');

  const { itemCount, openCart } = useCart();
  const { customer, logout, openAuthModal } = useAuth();
  const router = useRouter();

  const base           = `/${lang}`;
  const profileRef     = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const NAV_LINKS = [
    { href: base, label: dict.nav.home },
    { href: `${base}/shop`, label: dict.nav.shop },
    { href: `${base}/about`, label: dict.nav.about },
    { href: `${base}/contact`, label: dict.nav.contact },
  ];

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  // Auto-focus search input when overlay opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [searchOpen]);

  // Close search on Escape
  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [searchOpen]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    router.push(`${base}/shop?q=${encodeURIComponent(q)}`);
  }, [searchQuery, base, router]);

  const handleProfileClick = useCallback(() => {
    if (!customer) {
      openAuthModal();
    } else {
      setProfileOpen((v) => !v);
    }
  }, [customer, openAuthModal]);

  const handleLogout = useCallback(async () => {
    setProfileOpen(false);
    await logout();
  }, [logout]);

  // Avatar initial from customer name
  const avatarInitial = customer?.name?.charAt(0).toUpperCase() ?? null;

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
            🌸 LilyGem Studio
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

          {/* ── Right-side icons ─────────────────────────────────────── */}
          <div className="flex items-center gap-1">

            {/* Desktop only: Search + Profile + Language switcher */}
            <div className="hidden xl:flex items-center gap-1">

              {/* Search icon */}
              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-md text-(--color-sand) transition-colors hover:bg-white/10 hover:text-(--color-cream)"
                aria-label={dict.header.search_label}
                aria-expanded={searchOpen}
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Cart badge — desktop */}
              <button
                type="button"
                onClick={openCart}
                className="relative flex h-10 w-10 items-center justify-center rounded-md text-(--color-sand) transition-colors hover:bg-white/10 hover:text-(--color-cream)"
                aria-label={dict.header.cart_aria}
              >
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-(--color-cta) px-1 text-[10px] font-700 text-white leading-none">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </button>

              {/* Profile icon */}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={handleProfileClick}
                  className="flex h-10 w-10 items-center justify-center rounded-md text-(--color-sand) transition-colors hover:bg-white/10 hover:text-(--color-cream)"
                  aria-label={dict.header.profile}
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                >
                  {customer && avatarInitial ? (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-(--color-cta) text-[13px] font-700 text-white leading-none">
                      {avatarInitial}
                    </span>
                  ) : (
                    <UserCircle className="h-5 w-5" />
                  )}
                </button>

                {/* Profile dropdown */}
                {profileOpen && customer && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-(--color-border) bg-(--color-surface) shadow-lg overflow-hidden z-50"
                  >
                    {/* Customer name row */}
                    <div className="flex items-center gap-3 border-b border-(--color-border) px-4 py-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-cta) text-[13px] font-700 text-white">
                        {avatarInitial}
                      </span>
                      <span className="truncate text-sm font-600 text-(--color-stone)">
                        {customer.name}
                      </span>
                    </div>

                    {/* Links */}
                    <div className="py-1">
                      <Link
                        href={`${base}/account`}
                        onClick={() => setProfileOpen(false)}
                        role="menuitem"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-(--color-stone) hover:bg-(--color-sand) transition-colors"
                      >
                        <User className="h-4 w-4 text-(--color-muted)" />
                        {dict.header.my_account}
                      </Link>
                      <Link
                        href={`${base}/account/orders`}
                        onClick={() => setProfileOpen(false)}
                        role="menuitem"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-(--color-stone) hover:bg-(--color-sand) transition-colors"
                      >
                        <Package className="h-4 w-4 text-(--color-muted)" />
                        {dict.header.my_orders}
                      </Link>
                      <Link
                        href={`${base}/account/addresses`}
                        onClick={() => setProfileOpen(false)}
                        role="menuitem"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-(--color-stone) hover:bg-(--color-sand) transition-colors"
                      >
                        <MapPin className="h-4 w-4 text-(--color-muted)" />
                        {dict.header.my_addresses}
                      </Link>
                    </div>

                    <div className="border-t border-(--color-border) py-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        role="menuitem"
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        {dict.header.sign_out}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Language switcher */}
              <LanguageSwitcher currentLang={lang} dict={dict} />
            </div>

            {/* Cart badge — mobile only */}
            <button
              type="button"
              onClick={openCart}
              className="xl:hidden relative flex h-10 w-10 items-center justify-center rounded-md text-(--color-sand) transition-colors hover:bg-white/10 hover:text-(--color-cream)"
              aria-label={dict.header.cart_aria}
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-(--color-cta) px-1 text-[10px] font-700 text-white leading-none">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>

            {/* Hamburger — mobile only */}
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

        {/* ── Search overlay ─────────────────────────────────────────── */}
        {searchOpen && (
          <div className="border-t border-white/10 bg-(--color-stone) px-4 py-3 md:px-6 lg:px-8">
            <form onSubmit={handleSearchSubmit} className="mx-auto max-w-[1280px]">
              <div className="relative flex items-center">
                <Search className="absolute left-3 h-4 w-4 text-(--color-sand-dark) pointer-events-none" aria-hidden="true" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={dict.header.search_placeholder}
                  className="w-full rounded-lg bg-white/10 py-2.5 pl-9 pr-10 text-sm text-(--color-cream) placeholder:text-(--color-sand-dark) outline-none focus:ring-1 focus:ring-(--color-cta)"
                  aria-label={dict.header.search_label}
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-2 flex h-6 w-6 items-center justify-center rounded text-(--color-sand-dark) hover:text-(--color-cream)"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </header>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} dict={dict} lang={lang} />
    </>
  );
}
