'use client';

/**
 * MobileFilterButton — filter toggle + bottom-sheet drawer for mobile shop page.
 *
 * WHY SEPARATE FROM CatalogFilters: CatalogFilters manages URL state and can be
 * rendered inside any container (sidebar on desktop, drawer on mobile). This
 * component wraps it in a Framer Motion bottom sheet and controls open/close state.
 *
 * Shows an active-filter count badge when filters are applied.
 */

import { useState } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CatalogFilters } from './CatalogFilters';
import { useDict } from '@/context/DictionaryContext';
import type { CategoryWithChildren } from '@/types';

interface MobileFilterButtonProps {
  categories: CategoryWithChildren[];
  activeCount?: number;
  preferVnd?: boolean;
}

export function MobileFilterButton({ categories, activeCount = 0, preferVnd = false }: MobileFilterButtonProps) {
  const dict = useDict();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-(--color-border) px-3 py-1.5 text-sm font-500 text-(--color-stone)"
        aria-label={activeCount > 0 ? dict.catalog.filters_aria.replace('{n}', String(activeCount)) : dict.catalog.filters_title}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
        {dict.catalog.filter_button}
        {activeCount > 0 && (
          <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-(--color-cta) px-1 text-[10px] font-700 text-white">
            {activeCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="filter-backdrop"
              className="fixed inset-0 z-[150] bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer */}
            <motion.div
              key="filter-drawer"
              role="dialog"
              aria-modal="true"
              aria-label={dict.catalog.filters_title}
              className="fixed bottom-0 left-0 right-0 z-[151] max-h-[85dvh] overflow-y-auto rounded-t-[20px] bg-(--color-surface) px-5 pt-4"
              style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {/* Drag handle */}
              <div className="mb-4 flex justify-center">
                <div className="h-1 w-10 rounded-full bg-(--color-border)" aria-hidden="true" />
              </div>

              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-sm font-700 uppercase tracking-widest text-(--color-stone)">
                  {dict.catalog.filters_title}
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-(--color-muted) transition-colors hover:bg-(--color-border)"
                  aria-label={dict.catalog.close_filters}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Filter content — reuses desktop CatalogFilters unchanged */}
              <CatalogFilters categories={categories} dict={dict.catalog} preferVnd={preferVnd} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
