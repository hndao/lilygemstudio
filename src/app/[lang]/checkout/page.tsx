/**
 * Checkout page — server wrapper.
 *
 * Loads the dictionary and geo-country server-side, passes both to CheckoutWizard.
 * isVn is derived from NEXT_COUNTRY cookie (set by middleware from Cloudflare/Vercel
 * IP headers), NOT from the UI language — a VN user can browse in English and still
 * get VND pricing and local payment methods.
 */

import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { CheckoutWizard } from './CheckoutWizard';

interface CheckoutPageProps {
  params: Promise<{ lang: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { lang } = await params;
  const cookieStore = await cookies();
  const country = cookieStore.get('NEXT_COUNTRY')?.value ?? 'GLOBAL';
  const isVn = country === 'VN';
  const dict = await getDictionary(lang);
  return <CheckoutWizard lang={lang} dict={dict.checkout} isVn={isVn} />;
}
