/**
 * Catalog page — /shop
 *
 * WHY RSC: All product data is fetched server-side from URL search params.
 * The filter/sort/page state lives in the URL — no client state needed for
 * the data layer. Client components (CatalogFilters, CatalogSort, Pagination)
 * only handle URL mutation, not data fetching.
 *
 * LAYOUT (from wireframes):
 *  - Mobile:  full-width grid, filter drawer toggle at top
 *  - Tablet+: filter sidebar (220px) + grid side-by-side
 */

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getProducts, getCategories } from '@/lib/api';
import { ProductGrid } from '@/components/features/ProductGrid';
import { CatalogFilters } from '@/components/features/CatalogFilters';
import { CatalogSort } from '@/components/features/CatalogSort';
import { Pagination } from '@/components/features/Pagination';
import type { ProductListParams } from '@/types';

export const revalidate = 86400; // 24h ISR — matches PRODUCT_LIST TTL

export const metadata: Metadata = {
  title: 'Shop All Artisan Products',
  description: 'Browse our curated collection of handpicked artisan goods with verified reviews.',
};

interface ShopPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    sort?: string;
    badge?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const sp = await searchParams;

  const params: ProductListParams = {
    page: sp.page ? Number(sp.page) : 1,
    perPage: 24,
    category: sp.category,
    sort: sp.sort as ProductListParams['sort'],
    badge: sp.badge as ProductListParams['badge'],
  };

  // Fetch products and categories in parallel — no waterfall
  const [result, categories] = await Promise.all([
    getProducts(params).catch(() => null),
    getCategories().catch(() => []),
  ]);
  const products = result?.data ?? [];
  const meta = result?.meta ?? { total: 0, currentPage: 1, lastPage: 1, perPage: 24 };

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 md:py-10 lg:px-8">

      {/* Page header */}
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl">Shop All Products</h1>
          <p className="mt-1 text-sm text-(--color-muted)">{meta.total} items</p>
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

        {/* Filter sidebar — tablet+ visible, mobile hidden (drawer handled separately) */}
        <Suspense>
          <CatalogFilters categories={categories} className="hidden md:block" />
        </Suspense>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {/* Mobile: sort + filter toggle row */}
          <div className="mb-4 flex items-center justify-between md:hidden">
            <Suspense>
              <CatalogSort />
            </Suspense>
            <Suspense>
              <MobileFilterToggle />
            </Suspense>
          </div>

          {products.length > 0 ? (
            <>
              {/* Tablet grid is 2-col (sidebar takes ~220px), desktop is 3-col */}
              <ProductGrid
                products={products}
                priorityCount={6}
              />
              <Suspense>
                <Pagination
                  currentPage={meta.currentPage}
                  lastPage={meta.lastPage}
                  total={meta.total}
                />
              </Suspense>
            </>
          ) : (
            <div className="flex min-h-[300px] items-center justify-center text-(--color-muted)">
              No products match your filters.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// Inline mobile filter toggle — opens the CatalogFilters as a drawer
// Kept small here; full drawer implementation is in CatalogFilters
function MobileFilterToggle() {
  return (
    <button className="flex items-center gap-1.5 rounded-md border border-(--color-border) px-3 py-1.5 text-sm font-500 text-(--color-stone)">
      Filters ▼
    </button>
  );
}

