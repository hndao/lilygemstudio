'use client';

/**
 * ActiveFiltersBar — shows dismissible chips for every active filter.
 *
 * Rendered between the page header and the product grid. Each chip removes
 * its own filter from the URL; "Clear all" resets everything except sort/search.
 */

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import type { CategoryWithChildren } from '@/types';
import type { Dictionary } from '@/lib/i18n';

interface ActiveFiltersBarProps {
  categories: CategoryWithChildren[];
  preferVnd: boolean;
  dict: Dictionary['catalog'];
}

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
}

export function ActiveFiltersBar({ categories, preferVnd, dict }: ActiveFiltersBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  // pathname is e.g. "/en/shop" — keep the lang prefix for navigation
  const shopBase = pathname.split('/shop')[0] + '/shop';

  const category   = searchParams.get('category') ?? '';
  const badge      = searchParams.get('badge') ?? '';
  const priceMin   = searchParams.get('price_min') ?? '';
  const priceMax   = searchParams.get('price_max') ?? '';
  const inStock    = searchParams.get('in_stock') === '1';

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function push(overrides: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    next.delete('page'); // reset pagination on filter change
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    router.push(`${shopBase}?${next.toString()}`);
  }

  function resolveCategoryName(slug: string): string {
    for (const cat of categories) {
      if (cat.slug === slug) return cat.name;
      for (const child of cat.children ?? []) {
        if (child.slug === slug) return child.name;
      }
    }
    return slug;
  }

  function resolvePriceLabel(): string {
    if (!priceMin && !priceMax) return '';
    if (preferVnd) {
      if (!priceMin && priceMax) return dict.price_under_1m;
      if (priceMin === '1000000' && priceMax === '3000000') return dict.price_1m_3m;
      if (priceMin === '3000000' && priceMax === '5000000') return dict.price_3m_5m;
      if (priceMin && !priceMax) return dict.price_over_5m;
    } else {
      if (!priceMin && priceMax) return dict.price_under_50;
      if (priceMin === '5000' && priceMax === '20000') return dict.price_50_200;
      if (priceMin === '20000' && priceMax === '50000') return dict.price_200_500;
      if (priceMin && !priceMax) return dict.price_over_500;
    }
    return `${priceMin}–${priceMax}`;
  }

  const BADGE_LABELS: Record<string, string> = {
    bestseller: dict.badge_bestseller,
    new:        dict.badge_new,
    sale:       dict.badge_sale,
    limited:    dict.badge_limited,
  };

  // ── Build chips ──────────────────────────────────────────────────────────────

  const chips: Chip[] = [];

  if (category) {
    chips.push({
      key: 'category',
      label: resolveCategoryName(category),
      onRemove: () => push({ category: null }),
    });
  }

  const priceLabel = resolvePriceLabel();
  if (priceLabel) {
    chips.push({
      key: 'price',
      label: priceLabel,
      onRemove: () => push({ price_min: null, price_max: null, price_currency: null }),
    });
  }

  if (badge && badge !== 'all') {
    chips.push({
      key: 'badge',
      label: BADGE_LABELS[badge] ?? badge,
      onRemove: () => push({ badge: null }),
    });
  }

  if (inStock) {
    chips.push({
      key: 'in_stock',
      label: dict.in_stock_only,
      onRemove: () => push({ in_stock: null }),
    });
  }

  if (chips.length === 0) return null;

  function clearAll() {
    const next = new URLSearchParams();
    const sort = searchParams.get('sort');
    const q    = searchParams.get('q');
    if (sort) next.set('sort', sort);
    if (q)    next.set('q', q);
    router.push(`${shopBase}?${next.toString()}`);
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1 text-sm font-500 text-(--color-stone) transition-colors hover:border-(--color-stone)"
        >
          {chip.label}
          <X className="h-3.5 w-3.5 shrink-0 text-(--color-muted)" aria-hidden="true" />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={clearAll}
          className="text-sm text-(--color-muted) underline underline-offset-2 hover:text-(--color-stone)"
        >
          {dict.reset_filters}
        </button>
      )}
    </div>
  );
}
