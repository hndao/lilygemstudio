'use client';

/**
 * CatalogFilters — filter sidebar (tablet/desktop) and filter drawer (mobile).
 *
 * IMMEDIATE NAVIGATION PATTERN:
 *  - Each filter selection immediately updates the URL (router.push)
 *  - No pending/Apply step — selections are reflected in results instantly
 *
 * CATEGORY HIERARCHY:
 *  - Top-level categories shown with expand/collapse
 *  - Children indented beneath their parent
 *
 * PRICE BRACKETS:
 *  - VND brackets shown when `preferVnd=true` (Vietnamese users)
 *  - USD brackets shown for global users
 *
 * DYNAMIC FIELD FILTERS:
 *  - Rendered from selectedCategory.filterDefinitions (from API)
 *  - color_swatch → hex circles
 *  - button_grid  → pill toggles (multi-select)
 *  - checkbox     → checkboxes (multi-select)
 */

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { CategoryWithChildren, FilterDefinition, ProductCard } from '@/types';
import type { Dictionary } from '@/lib/i18n';

// ── Sub-components ─────────────────────────────────────────────────────────────

type BadgeValue = 'all' | 'bestseller' | 'new' | 'sale' | 'limited' | 'natural';
const BADGE_VALUES: BadgeValue[] = ['all', 'bestseller', 'new', 'sale', 'limited'];

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-(--color-border) py-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between font-heading text-sm font-600 text-(--color-stone)"
        aria-expanded={open}
      >
        {title}
        {open
          ? <ChevronUp className="h-4 w-4 text-(--color-muted)" />
          : <ChevronDown className="h-4 w-4 text-(--color-muted)" />
        }
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

interface CategoryRowProps {
  cat: CategoryWithChildren;
  activeCategory: string;
  onSelect: (slug: string) => void;
}

function CategoryRow({ cat, activeCategory, onSelect }: CategoryRowProps) {
  const isChildActive = cat.children.some((c) => c.slug === activeCategory);
  const [expanded, setExpanded] = useState(isChildActive || activeCategory === cat.slug);
  const hasChildren = cat.children.length > 0;

  return (
    <li>
      <div className="flex items-center gap-1">
        <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm text-(--color-stone)">
          <input
            type="radio"
            name="category"
            value={cat.slug}
            checked={activeCategory === cat.slug}
            onChange={() => onSelect(cat.slug)}
            className="accent-(--color-sage)"
          />
          <span className="font-500">{cat.name}</span>
          <span className="ml-auto text-xs text-(--color-muted)">{cat.productCount}</span>
        </label>
        {hasChildren && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="ml-1 rounded p-0.5 text-(--color-muted) hover:text-(--color-stone)"
            aria-label={expanded ? `Collapse ${cat.name}` : `Expand ${cat.name}`}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {hasChildren && expanded && (
        <ul className="mt-1.5 flex flex-col gap-1.5 border-l-2 border-(--color-border) pl-3 ml-1">
          {cat.children.map((child) => (
            <li key={child.slug}>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-(--color-stone)">
                <input
                  type="radio"
                  name="category"
                  value={child.slug}
                  checked={activeCategory === child.slug}
                  onChange={() => onSelect(child.slug)}
                  className="accent-(--color-sage)"
                />
                {child.name}
                <span className="ml-auto text-xs text-(--color-muted)">{child.productCount}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

// ── Price bracket helpers ──────────────────────────────────────────────────────

interface PriceBracket {
  label: string;
  min?: number;
  max?: number;
}

function getPriceBrackets(preferVnd: boolean, dict: Dictionary['catalog']): PriceBracket[] {
  if (preferVnd) {
    return [
      { label: dict.price_all },
      { label: dict.price_under_1m, max: 1_000_000 },
      { label: dict.price_1m_3m, min: 1_000_000, max: 3_000_000 },
      { label: dict.price_3m_5m, min: 3_000_000, max: 5_000_000 },
      { label: dict.price_over_5m, min: 5_000_000 },
    ];
  }
  return [
    { label: dict.price_all },
    { label: dict.price_under_50, max: 5000 },        // $50 = 5000¢
    { label: dict.price_50_200, min: 5000, max: 20000 },
    { label: dict.price_200_500, min: 20000, max: 50000 },
    { label: dict.price_over_500, min: 50000 },
  ];
}

function priceKey(bracket: PriceBracket): string {
  return `${bracket.min ?? ''}-${bracket.max ?? ''}`;
}

// ── Dynamic field filter sections ─────────────────────────────────────────────

interface FieldFilterSectionProps {
  def: FilterDefinition;
  activeValues: string[];
  onToggle: (value: string) => void;
}

function FieldFilterSection({ def, activeValues, onToggle }: FieldFilterSectionProps) {
  if (def.options.length === 0) return null;

  const label = def.label;

  if (def.display === 'color_swatch') {
    return (
      <FilterSection title={label}>
        <div className="flex flex-wrap gap-2">
          {def.options.map((opt) => {
            const active = activeValues.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                title={opt.label}
                aria-label={opt.label}
                aria-pressed={active}
                onClick={() => onToggle(opt.value)}
                className={`h-7 w-7 rounded-full border-2 transition-transform ${
                  active
                    ? 'border-(--color-cta) scale-110'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: opt.hex ?? '#ccc' }}
              />
            );
          })}
        </div>
      </FilterSection>
    );
  }

  if (def.display === 'button_grid') {
    return (
      <FilterSection title={label}>
        <div className="flex flex-wrap gap-1.5">
          {def.options.map((opt) => {
            const active = activeValues.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={active}
                onClick={() => onToggle(opt.value)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  active
                    ? 'border-(--color-cta) bg-(--color-cta) text-white'
                    : 'border-(--color-border) text-(--color-stone) hover:border-(--color-cta)'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </FilterSection>
    );
  }

  // Default: checkbox
  return (
    <FilterSection title={label}>
      <ul className="flex flex-col gap-1.5">
        {def.options.map((opt) => (
          <li key={opt.value}>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-(--color-stone)">
              <input
                type="checkbox"
                checked={activeValues.includes(opt.value)}
                onChange={() => onToggle(opt.value)}
                className="accent-(--color-sage)"
              />
              {opt.label}
            </label>
          </li>
        ))}
      </ul>
    </FilterSection>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

const RESERVED_PARAMS = new Set([
  'page', 'sort', 'q', 'category', 'badge',
  'price_min', 'price_max', 'price_currency', 'in_stock', 'variant_fields',
]);

interface CatalogFiltersProps {
  categories?: CategoryWithChildren[];
  className?: string;
  dict?: Dictionary['catalog'];
  /** When true, show VND price brackets instead of USD */
  preferVnd?: boolean;
}

export function CatalogFilters({
  categories = [],
  className = '',
  dict,
  preferVnd = false,
}: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Current filter values — read directly from URL ────────────────────────
  const category = searchParams.get('category') ?? '';
  const badge = searchParams.get('badge') ?? 'all';
  const priceMin = Number(searchParams.get('price_min')) || undefined;
  const priceMax = Number(searchParams.get('price_max')) || undefined;
  const inStock = searchParams.get('in_stock') === '1';

  const customFilters = useMemo(() => {
    const cf: Record<string, string[]> = {};
    searchParams.forEach((value, key) => {
      if (!RESERVED_PARAMS.has(key)) {
        cf[key] = value.split(',').filter(Boolean);
      }
    });
    return cf;
  }, [searchParams]);

  // ── Find selected category's filterDefinitions ────────────────────────────
  const selectedCategoryData = useMemo(() => {
    for (const cat of categories) {
      if (cat.slug === category) return cat;
      for (const child of cat.children ?? []) {
        if (child.slug === category) return child;
      }
    }
    return null;
  }, [categories, category]);
  const filterDefinitions: FilterDefinition[] = selectedCategoryData?.filterDefinitions ?? [];

  // ── Price brackets ────────────────────────────────────────────────────────
  const d = dict;
  const priceBrackets = d ? getPriceBrackets(preferVnd, d) : [];
  const activePriceBracket = priceBrackets.find(
    (b) => (b.min ?? undefined) === priceMin && (b.max ?? undefined) === priceMax
  ) ?? priceBrackets[0];

  // ── Navigate: merge current URL params with overrides and push ────────────
  function navigate(overrides: {
    category?: string;
    badge?: string;
    priceMin?: number | undefined;
    priceMax?: number | undefined;
    priceCurrency?: string | undefined;
    inStock?: boolean;
    customFilters?: Record<string, string[]>;
  }) {
    const next = new URLSearchParams();
    const sort = searchParams.get('sort');
    const q = searchParams.get('q');
    if (sort) next.set('sort', sort);
    if (q) next.set('q', q);

    const cat     = 'category'     in overrides ? overrides.category!     : category;
    const bdg     = 'badge'        in overrides ? overrides.badge!         : badge;
    const pMin    = 'priceMin'     in overrides ? overrides.priceMin       : priceMin;
    const pMax    = 'priceMax'     in overrides ? overrides.priceMax       : priceMax;
    const pCur    = 'priceCurrency'in overrides ? overrides.priceCurrency  : (searchParams.get('price_currency') || undefined);
    const stock   = 'inStock'      in overrides ? overrides.inStock!       : inStock;
    const cf      = 'customFilters'in overrides ? overrides.customFilters! : customFilters;

    if (cat) next.set('category', cat);
    if (bdg && bdg !== 'all') next.set('badge', bdg);
    if (pMin) next.set('price_min', String(pMin));
    if (pMax) next.set('price_max', String(pMax));
    if (pCur) next.set('price_currency', pCur);
    if (stock) next.set('in_stock', '1');
    for (const [field, values] of Object.entries(cf)) {
      if (values.length > 0) next.set(field, values.join(','));
    }

    // Derive variant_fields from the (possibly new) category
    const catForDefs = 'category' in overrides ? overrides.category! : category;
    let catData = null;
    for (const c of categories) {
      if (c.slug === catForDefs) { catData = c; break; }
      for (const child of c.children ?? []) {
        if (child.slug === catForDefs) { catData = child; break; }
      }
      if (catData) break;
    }
    const defs: FilterDefinition[] = catData?.filterDefinitions ?? filterDefinitions;
    const variantFields = defs.filter((fd) => fd.source === 'variant').map((fd) => fd.name);
    if (variantFields.length > 0) next.set('variant_fields', variantFields.join(','));

    router.push(`/shop?${next.toString()}`);
  }

  function handleCategoryChange(slug: string) {
    navigate({ category: slug, customFilters: {} });
  }

  function handlePriceBracket(bracket: PriceBracket) {
    const currency = preferVnd ? 'vnd' : 'usd';
    navigate({
      priceMin: bracket.min,
      priceMax: bracket.max,
      priceCurrency: bracket.min || bracket.max ? currency : undefined,
    });
  }

  function handleCustomFilterToggle(fieldName: string, value: string) {
    const current = customFilters[fieldName] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    const newCf = { ...customFilters };
    if (next.length > 0) newCf[fieldName] = next;
    else delete newCf[fieldName];
    navigate({ customFilters: newCf });
  }

  // ── Badge label helper ────────────────────────────────────────────────────
  const badgeLabel = (value: BadgeValue): string => {
    if (!d) return value.charAt(0).toUpperCase() + value.slice(1);
    if (value === 'all') return d.all;
    if (value === 'bestseller') return d.badge_bestseller;
    if (value === 'new') return d.badge_new;
    if (value === 'sale') return d.badge_sale;
    if (value === 'limited') return d.badge_limited;
    return value;
  };

  return (
    <aside className={`w-full md:w-[220px] shrink-0 ${className}`} aria-label="Product filters">
      <h2 className="font-heading text-sm font-700 uppercase tracking-widest text-(--color-stone)">
        {d?.filters_heading ?? 'Filters'}
      </h2>

      {/* 1. Category */}
      <FilterSection title={d?.category ?? 'Category'}>
        <ul className="flex flex-col gap-2">
          <li>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-(--color-stone)">
              <input
                type="radio"
                name="category"
                value=""
                checked={!category}
                onChange={() => handleCategoryChange('')}
                className="accent-(--color-sage)"
              />
              {d?.all ?? 'All'}
            </label>
          </li>
          {categories.map((cat) => (
            <CategoryRow
              key={cat.slug}
              cat={cat}
              activeCategory={category}
              onSelect={handleCategoryChange}
            />
          ))}
        </ul>
      </FilterSection>

      {/* 2. Price Range */}
      {priceBrackets.length > 0 && (
        <FilterSection title={d?.price_range ?? 'Price Range'}>
          <ul className="flex flex-col gap-1.5">
            {priceBrackets.map((bracket) => (
              <li key={priceKey(bracket)}>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-(--color-stone)">
                  <input
                    type="radio"
                    name="price_range"
                    checked={priceKey(bracket) === priceKey(activePriceBracket ?? priceBrackets[0])}
                    onChange={() => handlePriceBracket(bracket)}
                    className="accent-(--color-sage)"
                  />
                  {bracket.label}
                </label>
              </li>
            ))}
          </ul>
        </FilterSection>
      )}

      {/* 3. Dynamic field filters from selected category */}
      {filterDefinitions.map((def) => (
        <FieldFilterSection
          key={def.name}
          def={def}
          activeValues={customFilters[def.name] ?? []}
          onToggle={(value) => handleCustomFilterToggle(def.name, value)}
        />
      ))}

      {/* 4. Badge */}
      <FilterSection title={d?.badge ?? 'Badge'}>
        <ul className="flex flex-col gap-1.5">
          {BADGE_VALUES.map((value) => (
            <li key={value}>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-(--color-stone)">
                <input
                  type="radio"
                  name="badge"
                  value={value}
                  checked={badge === value}
                  onChange={() => navigate({ badge: value })}
                  className="accent-(--color-sage)"
                />
                {badgeLabel(value)}
              </label>
            </li>
          ))}
        </ul>
      </FilterSection>

      {/* 5. In-stock toggle */}
      <div className="border-b border-(--color-border) py-4">
        <label className="flex cursor-pointer items-center justify-between text-sm text-(--color-stone)">
          <span className="font-500">{d?.in_stock_only ?? 'In stock only'}</span>
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => navigate({ inStock: e.target.checked })}
            className="accent-(--color-sage)"
          />
        </label>
      </div>

      {/* 6. Reset */}
      <div className="pt-4">
        <button
          type="button"
          onClick={() => router.push('/shop')}
          className="w-full rounded-full border border-(--color-border) px-4 py-2 text-sm text-(--color-muted) hover:border-(--color-stone) hover:text-(--color-stone)"
        >
          {d?.reset_filters ?? 'Reset'}
        </button>
      </div>
    </aside>
  );
}
