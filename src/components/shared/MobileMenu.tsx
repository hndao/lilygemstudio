'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { X, User, Package, MapPin, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useAuth } from '@/hooks/useAuth';
import type { Locale } from '@/middleware';
import type { Dictionary } from '@/lib/i18n';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  dict: Dictionary;
  lang: Locale;
}

export function MobileMenu({ isOpen, onClose, dict, lang }: MobileMenuProps) {
  const base = `/${lang}`;
  const { customer, logout, openAuthModal } = useAuth();

  const NAV_LINKS = [
    { href: base, label: dict.nav.home },
    { href: `${base}/shop`, label: dict.nav.shop },
    { href: `${base}/about`, label: dict.nav.about },
    { href: `${base}/contact`, label: dict.nav.contact },
  ];

  const ACCOUNT_LINKS = [
    { href: `${base}/account`, label: dict.header.my_account, icon: User },
    { href: `${base}/account/orders`, label: dict.header.my_orders, icon: Package },
    { href: `${base}/account/addresses`, label: dict.header.my_addresses, icon: MapPin },
  ];

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSignIn = () => {
    onClose();
    openAuthModal();
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-(--color-stone)/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.nav
            key="drawer"
            className="fixed inset-y-0 right-0 z-50 flex w-72 flex-col bg-(--color-cream) shadow-xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            aria-label="Mobile navigation"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-(--color-border) px-6 py-4">
              <span className="font-heading text-lg font-700 text-(--color-stone)">
                🌸 LilyGem Studio
              </span>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-(--color-muted) transition-colors hover:bg-(--color-sand) hover:text-(--color-stone)"
                aria-label={dict.header.close_menu}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav links */}
            <ul className="flex flex-col gap-1 p-4">
              {NAV_LINKS.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="block rounded-md px-4 py-3 font-heading text-base font-600 text-(--color-stone) transition-colors hover:bg-(--color-sand)"
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>

            {/* Language switcher */}
            <div className="border-t border-(--color-border) px-6 py-3">
              <LanguageSwitcher currentLang={lang} dict={dict} />
            </div>

            {/* Profile section */}
            <div className="mt-auto border-t border-(--color-border) p-4">
              {customer ? (
                <>
                  {/* Logged-in: name + links */}
                  <div className="mb-3 flex items-center gap-3 px-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-cta) text-[13px] font-700 text-white">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate text-sm font-600 text-(--color-stone)">
                      {customer.name}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-0.5">
                    {ACCOUNT_LINKS.map(({ href, label, icon: Icon }) => (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={onClose}
                          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-(--color-stone) transition-colors hover:bg-(--color-sand)"
                        >
                          <Icon className="h-4 w-4 text-(--color-muted)" />
                          {label}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        {dict.header.sign_out}
                      </button>
                    </li>
                  </ul>
                </>
              ) : (
                /* Not logged in: Sign in button */
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-(--color-cta) px-4 py-3 text-sm font-600 text-white transition-colors hover:bg-(--color-cta-hover)"
                >
                  <User className="h-4 w-4" />
                  {dict.header.sign_in}
                </button>
              )}
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
