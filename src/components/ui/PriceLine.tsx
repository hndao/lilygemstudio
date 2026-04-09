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
  priceVnd?: Money;
  compareAtPriceVnd?: Money;
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
  priceVnd,
  compareAtPriceVnd,
  size = 'sm',
  className = '',
}: PriceLineProps) {
  const sizes = SIZE_MAP[size];
  const isOnSale = compareAtPrice && compareAtPrice.amount > price.amount;
  const isOnSaleVnd = compareAtPriceVnd && priceVnd && compareAtPriceVnd.amount > priceVnd.amount;

  const renderPriceLabel = (current: Money, compare?: Money, saleBool?: boolean) => (
    <>
      <span
        className={[
          'font-heading',
          sizes.price,
          saleBool ? 'text-(--color-promo)' : 'text-(--color-terracotta-dark)',
        ].join(' ')}
        aria-label={`Price: ${current.formatted}`}
      >
        {current.formatted}
      </span>
      {saleBool && compare && (
        <span
          className={`font-body line-through text-(--color-sand-dark) ${sizes.compare}`}
          aria-label={`Original price: ${compare.formatted}`}
        >
          {compare.formatted}
        </span>
      )}
    </>
  );

  if (priceVnd) {
    return (
      <>
        {/* Global pricing — default. Hidden if country-vn is active */}
        <div className={`items-baseline gap-2 geo-hide-vn-flex ${className}`}>
          {renderPriceLabel(price, compareAtPrice, isOnSale)}
        </div>
        {/* VN pricing — hidden by default. Shown if country-vn is active */}
        <div className={`items-baseline gap-2 geo-show-vn-flex ${className}`}>
          {renderPriceLabel(priceVnd, compareAtPriceVnd, isOnSaleVnd)}
        </div>
      </>
    );
  }

  // Fallback: no VN price available, always show global
  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      {renderPriceLabel(price, compareAtPrice, isOnSale)}
    </div>
  );
}

