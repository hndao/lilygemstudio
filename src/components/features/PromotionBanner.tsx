/**
 * PromotionBanner — slim site-wide banner below the nav showing active auto-applied promos.
 *
 * RSC: fetches data server-side. Renders nothing when no active promotions exist.
 * Only shows promos that are NOT free_shipping (those are surfaced in CartDrawer instead).
 */

import { getActivePromotions } from '@/lib/promotionApi';
import { BadgeCountdown } from '@/components/ui/BadgeCountdown';
import { getDictionary } from '@/lib/i18n';

interface PromotionBannerProps {
  lang: string;
}

export async function PromotionBanner({ lang }: PromotionBannerProps) {
  const [promotions, dict] = await Promise.all([
    getActivePromotions(),
    getDictionary(lang),
  ]);

  // Show only non-free-shipping promos in the banner
  const visible = promotions.filter((p) => p.type !== 'free_shipping');
  if (visible.length === 0) return null;

  // Show the highest-priority promotion (first in list)
  const promo = visible[0];

  const valueLabel = (() => {
    if (promo.type === 'percent' && promo.value) return `${promo.value}% off`;
    if (promo.type === 'fixed_cents' && promo.value) {
      const amt = promo.valueCurrency === 'VND'
        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(promo.value)
        : `$${(promo.value / 100).toFixed(2)}`;
      return `${amt} off`;
    }
    return null;
  })();

  return (
    <div className="w-full bg-(--color-cta) px-4 py-2 text-center text-[13px] font-600 text-white">
      <span>{promo.name}</span>
      {valueLabel && <span className="ml-1 opacity-90">— {valueLabel}</span>}
      {promo.validUntil && (
        <span className="ml-2 inline-flex items-center gap-1 opacity-80">
          <span>·</span>
          <BadgeCountdown expiresAt={promo.validUntil} textColor="text-white" />
        </span>
      )}
    </div>
  );
}
