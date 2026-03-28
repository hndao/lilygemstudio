/**
 * Checkout page — server wrapper.
 *
 * Loads the dictionary server-side and passes it to the client CheckoutWizard.
 * This is the standard RSC pattern used throughout the app.
 */

import { getDictionary } from '@/lib/i18n';
import { CheckoutWizard } from './CheckoutWizard';

interface CheckoutPageProps {
  params: Promise<{ lang: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return <CheckoutWizard lang={lang} dict={dict.checkout} />;
}
