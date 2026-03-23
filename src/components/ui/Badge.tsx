/**
 * Badge — pill-shaped product tag (Natural, Bestseller, Sale, Limited).
 *
 * REDESIGNED to match the mockup's pill-shaped tags with Agate-inspired colors.
 * The "natural"/"new" variant includes a ✓ checkmark icon for trust signaling.
 *
 * STYLE: padding 4px 12px, rounded 20px (pill), font 11px/600.
 */

import type { ProductCard } from '@/types';

type BadgeVariant = NonNullable<ProductCard['badge']>;

const BADGE_CONFIG: Record<BadgeVariant, { label: string; className: string; icon?: boolean }> = {
  new: {
    label: 'Natural gemstone',
    // Moss Agate tint bg, dark moss text — includes checkmark icon
    className: 'bg-(--color-nature-bg) text-(--color-nature-text)',
    icon: true,
  },
  bestseller: {
    label: 'Bestseller',
    // Quartz Mist bg, Agate Brown text
    className: 'bg-(--color-quartz-mist) text-(--color-cta)',
  },
  sale: {
    label: 'Sale',
    // Rose Quartz tone
    className: 'bg-(--color-quartz-mist) text-(--color-promo)',
  },
  limited: {
    label: 'Limited',
    // Agate dark tone
    className: 'bg-(--color-quartz-mist) text-(--color-agate-dark)',
  },
};

interface BadgeProps {
  variant: BadgeVariant;
  className?: string;
}

export function Badge({ variant, className = '' }: BadgeProps) {
  const config = BADGE_CONFIG[variant];

  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-[20px] px-3 py-1 text-[11px] font-600',
        config.className,
        className,
      ].join(' ')}
      aria-label={config.label}
    >
      {config.icon && (
        <svg width="12" height="12" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4" />
          <path d="M6 9.5L8 11.5L12 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {config.label}
    </span>
  );
}
