'use client';

/**
 * CatalogSort — sort dropdown for the catalog page.
 *
 * WHY CLIENT COMPONENT: Syncs sort selection to URL search params so the
 * RSC catalog page re-fetches with the correct sort order. No local state
 * needed — the URL is the source of truth.
 */

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useDict } from '@/context/DictionaryContext';
import type { ProductListParams } from '@/types';

type SortOption = NonNullable<ProductListParams['sort']>;

export function CatalogSort() {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const lang = pathname.split('/')[1] ?? 'en';
  const dict = useDict();
  const s = dict.shop;

  const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
    { value: 'newest',    label: s.sort_newest },
    { value: 'top_rated', label: s.sort_top_rated },
    { value: 'price_asc', label: s.sort_price_asc },
    { value: 'price_desc', label: s.sort_price_desc },
  ];

  const activeSort = (params.get('sort') as SortOption) ?? 'newest';

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(params.toString());
    next.set('sort', e.target.value);
    next.delete('page');
    router.push(`/${lang}/shop?${next.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="catalog-sort"
        className="brand-label shrink-0"
      >
        {s.sort_label}
      </label>
      <select
        id="catalog-sort"
        value={activeSort}
        onChange={handleChange}
        className="rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-sm text-(--color-stone) focus:outline-none focus:ring-2 focus:ring-(--color-sage)"
      >
        {SORT_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </div>
  );
}
