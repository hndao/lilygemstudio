/**
 * Checkout success — server wrapper.
 *
 * Reads NEXT_COUNTRY and lang server-side so the client component
 * gets the correct locale and geo without hydration issues.
 */

import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { getSiteSettings } from '@/lib/api';
import { CheckoutSuccessContent } from './CheckoutSuccessContent';

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function CheckoutSuccessPage({ params }: Props) {
  const { lang }     = await params;
  const cookieStore  = await cookies();
  const isVn         = cookieStore.get('NEXT_COUNTRY')?.value === 'VN';
  const [dict, settings] = await Promise.all([
    getDictionary(lang),
    getSiteSettings().catch(() => null),
  ]);

  return (
    <Suspense fallback={<div className="min-h-screen bg-(--color-background)" />}>
      <CheckoutSuccessContent
        lang={lang}
        isVn={isVn}
        dict={dict.order_confirmation}
        zaloUrl={settings?.social?.social_zalo}
        messengerUrl={settings?.social?.social_messenger}
      />
    </Suspense>
  );
}
