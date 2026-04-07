/**
 * Badge — pill-shaped product badge rendered from admin-managed badge data.
 *
 * Color and label come directly from the badge object returned by the API
 * (backed by the `badges` table). No hardcoded variants — the admin controls
 * all badge names and colors via the Badge module in Filament.
 */

import type { ProductCard } from '@/types';

type ProductBadge = NonNullable<ProductCard['badge']>;

interface BadgeProps {
  badge: ProductBadge;
  className?: string;
}

export function Badge({ badge, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-[20px] px-3 py-1 text-[11px] font-600 ${className}`}
      style={{ backgroundColor: badge.color, color: badge.textColor }}
      aria-label={badge.name}
    >
      {badge.name}
    </span>
  );
}
