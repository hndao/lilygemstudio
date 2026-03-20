'use client';

/**
 * Pagination — page navigation for catalog.
 *
 * WHY URL-BASED: Page number lives in the URL (?page=2) so the RSC catalog
 * page re-fetches the correct slice. This also makes paginated pages
 * shareable and crawlable by search engines.
 *
 * BREAKPOINT: Mobile shows "Load More" style (hidden pagination, just next/prev).
 * Tablet+ shows numbered pagination per wireframe.
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
}

export function Pagination({ currentPage, lastPage, total }: PaginationProps) {
  const router = useRouter();
  const params = useSearchParams();

  if (lastPage <= 1) return null;

  function goToPage(page: number) {
    const next = new URLSearchParams(params.toString());
    next.set('page', String(page));
    router.push(`/shop?${next.toString()}`);
    // Scroll to top of grid on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Build page number array — show max 5 pages around current
  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(lastPage, currentPage + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  const btnBase = 'flex h-9 w-9 items-center justify-center rounded-md text-sm font-500 transition-colors';
  // WHY --color-cta: active page button uses white text — needs ≥4.5:1 contrast.
  // --color-cta (#5C6B45) gives 7.09:1 vs --color-sage (#76885B) at 4.60:1.
  const btnActive = 'bg-(--color-cta) text-white';
  const btnInactive = 'border border-(--color-border) text-(--color-stone) hover:bg-(--color-sand)';
  const btnDisabled = 'opacity-40 cursor-not-allowed border border-(--color-border) text-(--color-muted)';

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-1"
      aria-label={`Pagination — ${total} products`}
    >
      {/* Previous */}
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnInactive}`}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Page numbers — hidden on mobile, visible on tablet+ */}
      <div className="hidden md:flex items-center gap-1">
        {start > 1 && (
          <>
            <button onClick={() => goToPage(1)} className={`${btnBase} ${btnInactive}`}>1</button>
            {start > 2 && <span className="px-1 text-(--color-muted)">…</span>}
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => goToPage(p)}
            className={`${btnBase} ${p === currentPage ? btnActive : btnInactive}`}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </button>
        ))}
        {end < lastPage && (
          <>
            {end < lastPage - 1 && <span className="px-1 text-(--color-muted)">…</span>}
            <button onClick={() => goToPage(lastPage)} className={`${btnBase} ${btnInactive}`}>{lastPage}</button>
          </>
        )}
      </div>

      {/* Mobile: just show "Page X of Y" */}
      <span className="md:hidden px-3 text-sm text-(--color-muted)">
        {currentPage} / {lastPage}
      </span>

      {/* Next */}
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === lastPage}
        className={`${btnBase} ${currentPage === lastPage ? btnDisabled : btnInactive}`}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

