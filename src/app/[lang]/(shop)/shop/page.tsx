/**
 * Catalog page — /shop
 *
 * WHY RSC: All listing data is fetched server-side from URL search params.
 * The filter/sort/page state lives in the URL — no client state needed for
 * the data layer. Client components (CatalogFilters, CatalogSort, Pagination)
 * only handle URL mutation, not data fetching.
 *
 * WHY LISTINGS NOT PRODUCTS: Listings are the sellable unit — they carry price,
 * stock state, and channel (platform=direct). The shop shows only items that
 * are currently for sale.
 */

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getListings, getCategories } from '@/lib/api';
import { getDictionary } from '@/lib/i18n';
import { ListingGrid } from '@/components/features/ListingGrid';
import { CatalogFilters } from '@/components/features/CatalogFilters';
import { CatalogSort } from '@/components/features/CatalogSort';
import { Pagination } from '@/components/features/Pagination';
import { MobileFilterButton } from '@/components/features/MobileFilterButton';
import type { ListingListParams } from '@/types';

export const revalidate = 86400; // 24h ISR — matches LISTING_LIST TTL

export const metadata: Metadata = {
  title: 'Cửa Hàng',
  description: 'Khám phá bộ sưu tập trang sức đá quý thủ công của chúng tôi.',
};

interface ShopPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
    q?: string;
    category?: string;
    badge?: string;
  }>;
}

export default async function ShopPage({ params, searchParams }: ShopPageProps) {
  const { lang } = await params;
  const sp = await searchParams;

  const listingParams: ListingListParams = {
    page: sp.page ? Number(sp.page) : 1,
    perPage: 24,
    platform: 'direct',
    sort: sp.sort as ListingListParams['sort'],
    ...(sp.q && { query: sp.q }),
    ...(sp.category && { category: sp.category }),
    ...(sp.badge && sp.badge !== 'all' && { badge: sp.badge }),
  };

  const activeFilterCount = [
    sp.category,
    sp.badge && sp.badge !== 'all' ? sp.badge : undefined,
  ].filter(Boolean).length;

  // Fetch listings, categories, and dict in parallel — no waterfall
  const [result, categories, dict] = await Promise.all([
    getListings(listingParams).catch(() => null),
    getCategories().catch(() => []),
    getDictionary(lang),
  ]);
  const listings = result?.data ?? [];
  const meta = result?.meta ?? { total: 0, currentPage: 1, lastPage: 1, perPage: 24 };

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 md:py-10 lg:px-8">

      {/* Page header */}
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-heading font-700 text-(--color-stone)">Cửa Hàng</h1>
          {sp.q ? (
            <p className="mt-1 text-sm text-(--color-sand-dark)">
              Kết quả cho &ldquo;{sp.q}&rdquo; — {meta.total} sản phẩm
            </p>
          ) : (
            <p className="mt-1 text-sm text-(--color-sand-dark)">{meta.total} sản phẩm</p>
          )}
        </div>
        {/* Sort — tablet+ only (mobile sort is inside filter drawer) */}
        <div className="hidden md:block">
          <Suspense>
            <CatalogSort />
          </Suspense>
        </div>
      </div>

      {/* Main layout: sidebar + grid */}
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10">

        {/* Filter sidebar — tablet+ visible, mobile hidden */}
        <Suspense>
          <CatalogFilters categories={categories} className="hidden md:block" dict={dict.catalog} />
        </Suspense>

        {/* Listing grid */}
        <div className="flex-1 min-w-0">
          {/* Mobile: sort + filter toggle row */}
          <div className="mb-4 flex items-center justify-between md:hidden">
            <Suspense>
              <CatalogSort />
            </Suspense>
            <Suspense>
              <MobileFilterButton categories={categories} activeCount={activeFilterCount} dict={dict.catalog} />
            </Suspense>
          </div>

          {listings.length > 0 ? (
            <>
              <ListingGrid listings={listings} priorityCount={6} />
              <Suspense>
                <Pagination
                  currentPage={meta.currentPage}
                  lastPage={meta.lastPage}
                  total={meta.total}
                />
              </Suspense>
            </>
          ) : (
            <div className="flex min-h-[300px] items-center justify-center text-(--color-sand-dark)">
              Không tìm thấy sản phẩm.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

