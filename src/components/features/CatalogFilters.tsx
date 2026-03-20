'use client';

/**
 * CatalogFilters — filter sidebar (tablet/desktop) and filter drawer (mobile).
 *
 * BREAKPOINT BEHAVIOUR (from wireframes):
 *  - Mobile:  hidden by default, opens as a bottom drawer via FilterDrawerToggle
 *  - Tablet+: collapsible sidebar, open by default, sections toggle individually
 *
 * CATEGORY HIERARCHY:
 *  - Top-level categories are shown with an expand/collapse toggle
 *  - Children are shown indented beneath their parent (family tree style)
 *  - Selecting a parent selects all products in that parent category
 *  - Selecting a child filters to that specific subcategory
 *
 * WHY CLIENT COMPONENT: Filter state is synced to URL search params via
 * router.push() so the RSC catalog page re-fetches with correct filters.
 */

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { CategoryWithChildren, ProductCard } from '@/types';

const BADGES: Array<{ value: NonNullable<ProductCard['badge']> | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'bestseller', label: 'Bestseller' },
  { value: 'new', label: 'New' },
  { value: 'sale', label: 'Sale' },
  { value: 'limited', label: 'Limited' },
];

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
}

function FilterSection({ title, children }: FilterSectionProps) {
  const [open, setOpen] = useState(true);
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

/**
 * A single parent category row with optional expandable children.
 * WHY SEPARATE COMPONENT: keeps the expand/collapse state isolated per parent
 * so toggling one parent doesn't affect others.
 */
interface CategoryRowProps {
  cat: CategoryWithChildren;
  activeCategory: string;
  onSelect: (slug: string) => void;
}

function CategoryRow({ cat, activeCategory, onSelect }: CategoryRowProps) {
  // Auto-expand if the active category is this parent or one of its children
  const isChildActive = cat.children.some((c) => c.slug === activeCategory);
  const [expanded, setExpanded] = useState(isChildActive || activeCategory === cat.slug);
  const hasChildren = cat.children.length > 0;

  return (
    <li>
      {/* Parent row */}
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
        {/* Expand/collapse toggle — only shown when there are children */}
        {hasChildren && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="ml-1 rounded p-0.5 text-(--color-muted) hover:text-(--color-stone)"
            aria-label={expanded ? `Collapse ${cat.name}` : `Expand ${cat.name}`}
          >
            {expanded
              ? <ChevronUp className="h-3.5 w-3.5" />
              : <ChevronDown className="h-3.5 w-3.5" />
            }
          </button>
        )}
      </div>

      {/* Children — indented family tree style */}
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

interface CatalogFiltersProps {
  categories?: CategoryWithChildren[];
  className?: string;
}

export function CatalogFilters({ categories = [], className = '' }: CatalogFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();

  const activeCategory = params.get('category') ?? '';
  const activeBadge = params.get('badge') ?? 'all';

  function applyFilter(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === 'All' || value === 'all') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    next.delete('page'); // reset to page 1 on filter change
    router.push(`/shop?${next.toString()}`);
  }

  return (
    <aside className={`w-full md:w-[220px] shrink-0 ${className}`} aria-label="Product filters">
      <h2 className="font-heading text-sm font-700 uppercase tracking-widest text-(--color-stone)">
        Filters
      </h2>

      {/* Category filter — 2-level family tree */}
      <FilterSection title="Category">
        <ul className="flex flex-col gap-2">
          {/* "All" option always first */}
          <li>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-(--color-stone)">
              <input
                type="radio"
                name="category"
                value=""
                checked={!activeCategory}
                onChange={() => applyFilter('category', 'all')}
                className="accent-(--color-sage)"
              />
              All
            </label>
          </li>
          {categories.map((cat) => (
            <CategoryRow
              key={cat.slug}
              cat={cat}
              activeCategory={activeCategory}
              onSelect={(slug) => applyFilter('category', slug)}
            />
          ))}
        </ul>
      </FilterSection>

      {/* Badge filter */}
      <FilterSection title="Badge">
        <ul className="flex flex-col gap-1.5">
          {BADGES.map(({ value, label }) => (
            <li key={value}>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-(--color-stone)">
                <input
                  type="radio"
                  name="badge"
                  value={value}
                  checked={activeBadge === value}
                  onChange={() => applyFilter('badge', value)}
                  className="accent-(--color-sage)"
                />
                {label}
              </label>
            </li>
          ))}
        </ul>
      </FilterSection>
    </aside>
  );
}

