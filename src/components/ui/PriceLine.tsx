/**
 * PriceLine — renders price with optional crossed-out compare-at price.
 *
 * WHY PRE-FORMATTED: The API returns `formatted: "$49.99"` strings — the
 * backend handles currency formatting so we never need Intl.NumberFormat
 * on the client. This avoids hydration mismatches from locale differences
 * between server and client environments.
 */

import type { Money } from '@/types';

interface PriceLineProps {
  price: Money;
  compareAtPrice?: Money;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: { price: 'text-sm font-600', compare: 'text-xs' },
  md: { price: 'text-base font-600', compare: 'text-sm' },
  lg: { price: 'text-xl font-700', compare: 'text-base' },
};

export function PriceLine({
  price,
  compareAtPrice,
  size = 'sm',
  className = '',
}: PriceLineProps) {
  const sizes = SIZE_MAP[size];
  const isOnSale = compareAtPrice && compareAtPrice.amount > price.amount;

  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      {/* Current price — sage colour when on sale to reinforce the deal */}
      <span
        className={[
          'font-heading',
          sizes.price,
          isOnSale ? 'text-(--color-sage)' : 'text-(--color-stone)',
        ].join(' ')}
        aria-label={`Price: ${price.formatted}`}
      >
        {price.formatted}
      </span>

      {/* Compare-at price — struck through, muted */}
      {isOnSale && (
        <span
          className={`font-body line-through text-(--color-muted) ${sizes.compare}`}
          aria-label={`Original price: ${compareAtPrice.formatted}`}
        >
          {compareAtPrice.formatted}
        </span>
      )}
    </div>
  );
}

