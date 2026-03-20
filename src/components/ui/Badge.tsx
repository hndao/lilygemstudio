/**
 * Badge — product status overlay (NEW, BESTSELLER, SALE, LIMITED).
 *
 * WHY SEPARATE COMPONENT: Badge copy and colour are business rules that
 * change independently of the card layout. Centralising here means a
 * marketing copy change ("BEST SELLER" → "TOP PICK") touches one file.
 */

import type { ProductCard } from '@/types';

type BadgeVariant = NonNullable<ProductCard['badge']>;

const BADGE_CONFIG: Record<BadgeVariant, { label: string; className: string }> = {
  new: {
    label: 'NEW',
    // Sage background — signals freshness, on-brand
    // WHY --color-cta: badge text is small (12px) — needs ≥4.5:1 contrast on white.
    className: 'bg-(--color-cta) text-white',
  },
  bestseller: {
    label: 'BESTSELLER',
    // Stone background — authority, trust signal
    className: 'bg-(--color-stone) text-(--color-cream)',
  },
  sale: {
    label: 'SALE',
    // Warm amber — urgency without aggressive red (artisan brand tone)
    className: 'bg-amber-600 text-white',
  },
  limited: {
    label: 'LIMITED',
    // Muted charcoal — scarcity signal, premium feel
    className: 'bg-(--color-charcoal) text-(--color-sand)',
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
        'self-start inline-block rounded px-2 py-0.5 font-heading text-[11px] font-semibold tracking-[0.2em] uppercase',
        config.className,
        className,
      ].join(' ')}
      aria-label={config.label}
    >
      {config.label}
    </span>
  );
}

