/**
 * [lang] Layout — LilyGemStudio
 *
 * Wraps all locale-specific pages with Header and Footer.
 * The `lang` param is forwarded to Header/Footer for locale-aware
 * navigation links and dictionary content.
 *
 * NOTE: html/body are in the root layout (src/app/layout.tsx).
 * This layout only adds the nav shell around page content.
 */

import type { ReactNode } from 'react';
import type { Locale } from '@/middleware';
import { SUPPORTED_LOCALES } from '@/middleware';
import { getDictionary } from '@/lib/i18n';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { CartDrawer } from '@/components/features/CartDrawer';
import { DictionaryProvider } from '@/context/DictionaryContext';
import { notFound } from 'next/navigation';

interface LangLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((lang) => ({ lang }));
}

export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = await params;

  // Guard against invalid locale segment (e.g. /de, /fr)
  if (!SUPPORTED_LOCALES.includes(lang as Locale)) {
    notFound();
  }

  const dict = await getDictionary(lang);
  const locale = lang as Locale;

  return (
    <DictionaryProvider dict={dict}>
      <Header dict={dict} lang={locale} />
      <main>{children}</main>
      <Footer dict={dict} lang={locale} />
      <CartDrawer />
    </DictionaryProvider>
  );
}
