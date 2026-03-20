'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Locale } from '@/middleware';
import type { Dictionary } from '@/lib/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  dict: Dictionary;
  lang: Locale;
}

export function MobileMenu({ isOpen, onClose, dict, lang }: MobileMenuProps) {
  const base = `/${lang}`;

  const NAV_LINKS = [
    { href: base, label: dict.nav.home },
    { href: `${base}/shop`, label: dict.nav.shop },
    { href: `${base}/about`, label: dict.nav.about },
    { href: `${base}/contact`, label: dict.nav.contact },
  ];

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

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
                🌸 LilyGem
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

            {/* Language switcher at the bottom */}
            <div className="mt-auto border-t border-(--color-border) px-6 py-4">
              <p className="mb-2 text-xs text-(--color-muted) uppercase tracking-widest">Language</p>
              <LanguageSwitcher currentLang={lang} dict={dict} />
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
