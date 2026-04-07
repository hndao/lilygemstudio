/**
 * Flash Sales page — /[lang]/flash-sales
 *
 * Fetches listings tagged with the 'flash-sale' badge via the existing
 * getListings({ badge: 'flash-sale' }) API — no new endpoint needed.
 * Reuses ListingGrid + BadgeCountdown.
 */

import type { Metadata } from 'next';
import { getListings } from '@/lib/api';
import { getDictionary } from '@/lib/i18n';
import { ListingGrid } from '@/components/features/ListingGrid';

export const revalidate = 3600; // 1h — flash sales change more frequently

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return {
    title: dict.shop.flash_sales_title,
    description: dict.shop.flash_sales_description,
  };
}

export default async function FlashSalesPage({ params }: Props) {
  const { lang } = await params;

  const [listingsRes, dict] = await Promise.all([
    getListings({ badge: 'flash-sale', perPage: 48 }),
    getDictionary(lang),
  ]);

  const listings = listingsRes.data;

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-700 text-(--color-stone)">
          {dict.shop.flash_sales_title}
        </h1>
        <p className="mt-1 text-[14px] text-(--color-muted)">
          {dict.shop.flash_sales_description}
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <div className="text-[48px]">⚡</div>
          <p className="text-[15px] font-600 text-(--color-stone)">
            {dict.shop.flash_sales_empty}
          </p>
        </div>
      ) : (
        <ListingGrid listings={listings} />
      )}
    </main>
  );
}
