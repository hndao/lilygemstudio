'use client';

import { useCart } from '@/context/CartContext';
import { useDict } from '@/context/DictionaryContext';

function formatAmount(cents: number, isVn: boolean): string {
  if (isVn) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(cents);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

interface FreeShippingBarProps {
  isVn: boolean;
}

export function FreeShippingBar({ isVn }: FreeShippingBarProps) {
  const { cart } = useCart();
  const dict = useDict();

  if (!cart || cart.freeShippingRemainingCents === null) return null;

  const remaining = cart.freeShippingRemainingCents;
  const subtotal  = isVn ? cart.subtotalCentsVnd : cart.subtotalCents;

  // Compute threshold from remaining + current subtotal
  const threshold = subtotal + remaining;
  const progress  = threshold > 0 ? Math.min(100, Math.round((subtotal / threshold) * 100)) : 100;
  const unlocked  = remaining === 0;

  return (
    <div className="rounded-[10px] bg-(--color-cream) px-3 py-2.5 text-[12px]">
      {unlocked ? (
        <p className="text-center font-600 text-green-600">
          {/* truck icon */}
          <span className="mr-1">🚚</span>
          {dict.cart.free_shipping_unlocked}
        </p>
      ) : (
        <>
          <p className="mb-1.5 text-(--color-stone-light)">
            {dict.cart.free_shipping_remaining.replace('{amount}', formatAmount(remaining, isVn))}
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-(--color-sand-light)">
            <div
              className="h-full rounded-full bg-(--color-cta) transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
