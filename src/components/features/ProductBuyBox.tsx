'use client';

/**
 * ProductBuyBox — Quantity picker and 3-tier CTA buttons.
 *
 * RENDERED ONLY FOR VIETNAMESE USERS via CSS `.country-vn` toggle.
 * Global users see AffiliateCTA.
 *
 * v2.1 changes (per lilygem-product-attributes-v2.1.html):
 *  - Size pills REMOVED — each agate piece is a unique fixed size.
 *  - selectedColor received from ProductVNPanel (shared state).
 *  - Cart payload includes colorSlug for multi-color products.
 *
 * ACTION HIERARCHY:
 *  - Primary:   "Thêm vào giỏ hàng" — keeps user in-system
 *  - Secondary: "Zalo" + "Nhắn tin" — pre-purchase consultation channels
 *  - Tertiary:  "Yêu thích" — wishlist for retargeting
 */

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Heart, ShoppingCart } from 'lucide-react';
import { addToCart } from '@/lib/cart';
import type { Dictionary } from '@/lib/i18n';
import type { ColorOption, Money } from '@/types';

interface ProductBuyBoxProps {
  productId: string;
  productSlug: string;
  productName: string;
  price: Money;
  priceVnd?: Money;
  zaloUrl?: string;
  messengerUrl?: string;
  coverImage: string;
  /** Selected color from ProductVNPanel — passed into cart payload */
  selectedColor?: ColorOption | null;
  /** null = unlimited; 0 = out of stock; >0 = capped at this value */
  stockQuantity?: number | null;
  dict: Dictionary['buybox'];
}

export function ProductBuyBox({
  productId,
  productSlug,
  productName,
  price,
  priceVnd,
  zaloUrl,
  messengerUrl,
  coverImage,
  selectedColor,
  stockQuantity,
  dict,
}: ProductBuyBoxProps) {
  const maxQty = stockQuantity != null ? stockQuantity : 99;
  const isOutOfStock = stockQuantity === 0;
  const [quantity, setQuantity] = useState(isOutOfStock ? 0 : 1);
  const [wishlisted, setWishlisted] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const displayPrice = priceVnd ?? price;

  const handleAddToCart = useCallback(() => {
    addToCart({
      productId,
      slug: productSlug,
      name: productName,
      colorSlug: selectedColor?.slug,
      quantity,
      price: displayPrice,
      image: coverImage,
    });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, [quantity, productId, productSlug, productName, selectedColor, displayPrice, coverImage]);

  const handleWishlist = useCallback(() => {
    setWishlisted((prev) => !prev);
  }, []);

  const zaloHref = zaloUrl
    ? `${zaloUrl}?text=${encodeURIComponent(dict.zalo_text.replace('%s', productName))}`
    : '#';

  return (
    <div className="flex w-full flex-col gap-5">
      {/* ── Quantity Picker ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3.5">
        <span className="text-[13px] font-500 text-(--color-stone-light)">{dict.quantity}</span>
        <div className="inline-flex items-center overflow-hidden rounded-[8px] border-[1.5px] border-(--color-border)">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={isOutOfStock || quantity <= 1}
            className="flex h-10 w-10 items-center justify-center text-lg text-(--color-stone-light) transition-colors hover:bg-(--color-quartz-mist) disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={dict.decrease_qty}
          >
            −
          </button>
          <div className="flex h-10 w-12 items-center justify-center border-x-[1.5px] border-(--color-border) text-[15px] font-600 text-(--color-stone)">
            {isOutOfStock ? 0 : quantity}
          </div>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            disabled={isOutOfStock || quantity >= maxQty}
            className="flex h-10 w-10 items-center justify-center text-lg text-(--color-stone-light) transition-colors hover:bg-(--color-quartz-mist) disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={dict.increase_qty}
          >
            +
          </button>
        </div>
        {/* Stock badge */}
        {isOutOfStock ? (
          <span className="text-[12px] font-600 text-red-500">{dict.out_of_stock}</span>
        ) : stockQuantity != null && stockQuantity <= 10 ? (
          <span className="text-[12px] font-500 text-(--color-promo)">
            {dict.only_x_left.replace('%d', String(stockQuantity))}
          </span>
        ) : null}
      </div>

      {/* ── Primary CTA ────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-[12px] bg-(--color-cta) text-[16px] font-600 tracking-[0.02em] text-(--color-cream) transition-all hover:-translate-y-px hover:bg-(--color-cta-hover) hover:shadow-[0_4px_16px_rgba(139,111,78,0.25)] active:translate-y-0 active:bg-(--color-agate-dark) disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        aria-label={isOutOfStock ? dict.out_of_stock : `${dict.add_to_cart} ${productName}`}
      >
        <ShoppingCart className="h-5 w-5" aria-hidden="true" />
        {isOutOfStock ? dict.out_of_stock : dict.add_to_cart}
      </button>

      {/* ── Secondary Row: Zalo / Messenger / Yêu thích ──────────────── */}
      <div className="flex gap-2.5">
        {zaloUrl && (
          <a
            href={zaloHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-(--color-border) py-3 text-[13px] font-600 text-(--color-stone) transition-all hover:border-(--color-cta-hover) hover:bg-(--color-quartz-mist)"
            aria-label={dict.contact_zalo}
          >
            <Image src="/logo-zalo.webp" alt="Zalo" width={18} height={18} className="shrink-0" />
            Zalo
          </a>
        )}

        {messengerUrl && (
          <a
            href={messengerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-(--color-border) py-3 text-[13px] font-600 text-(--color-stone) transition-all hover:border-(--color-cta-hover) hover:bg-(--color-quartz-mist)"
            aria-label={dict.message}
          >
            <Image src="/logo-fb-msg.svg" alt="Messenger" width={18} height={18} className="shrink-0" />
            {dict.message}
          </a>
        )}

        <button
          type="button"
          onClick={handleWishlist}
          className={[
            'flex flex-1 items-center justify-center gap-2 rounded-[12px] border-[1.5px] py-3 text-[13px] font-600 transition-all',
            wishlisted
              ? 'border-(--color-promo) bg-(--color-promo)/10 text-(--color-promo)'
              : 'border-(--color-border) text-(--color-stone) hover:border-(--color-cta-hover) hover:bg-(--color-quartz-mist)',
          ].join(' ')}
          aria-label={wishlisted ? dict.wishlist_remove : dict.wishlist_add}
        >
          <Heart
            className={`h-[18px] w-[18px] text-(--color-promo) transition-transform ${wishlisted ? 'scale-110 fill-(--color-promo)' : ''}`}
            aria-hidden="true"
          />
          {wishlisted ? dict.wishlist_remove : dict.wishlist_add}
        </button>
      </div>

      {/* ── Success Toast ──────────────────────────────────────────────── */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 z-[200] -translate-x-1/2 animate-[slideUp_0.3s_ease-out] rounded-[12px] border border-(--color-border) bg-(--color-surface) px-5 py-3 text-sm font-600 text-(--color-stone) shadow-lg md:bottom-8">
          {dict.added_to_cart}
        </div>
      )}
    </div>
  );
}
