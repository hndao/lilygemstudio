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
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import type { Dictionary } from '@/lib/i18n';
import type { ColorOption, Money, ListingCard } from '@/types';

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
  /**
   * Active direct listing for this product.
   * null  = no active listing → "Currently unavailable"
   * present = use listing price + call API cart
   */
  listing?: ListingCard | null;
  /**
   * When true (default), the Add to Cart button shows VND price.
   * Set to false for global (non-VN) users to show USD price.
   */
  preferVnd?: boolean;
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
  listing,
  preferVnd = true,
}: ProductBuyBoxProps) {
  const { addItem } = useCart();

  // Listing-aware stock: listing.quantity overrides product stockQuantity when present
  const listingStock = listing !== undefined
    ? (listing?.quantity ?? null)
    : stockQuantity;
  const maxQty = listingStock != null ? listingStock : 99;
  const isUnavailable = listing === null; // no active listing
  const isOutOfStock  = listing !== undefined
    ? (listing?.quantity === 0 || listing?.productsActive === false)
    : (stockQuantity === 0);

  const [quantity, setQuantity]   = useState((isUnavailable || isOutOfStock) ? 0 : 1);
  const [addBusy, setAddBusy]     = useState(false);

  // Display price: respect preferVnd flag — VN users see ₫, global users see $
  const listingPriceDisplay = listing
    ? (preferVnd
        ? (listing.formattedPriceVnd ?? listing.formattedPrice)
        : (listing.formattedPrice ?? listing.formattedPriceVnd))
    : null;
  const displayPrice = preferVnd ? (priceVnd ?? price) : price;

  // Platform links for non-direct channels (e.g. Etsy)
  const externalLinks = (listing?.platformLinks ?? []).filter(
    (l) => l.platform !== 'direct' && l.url,
  );

  const handleAddToCart = useCallback(async () => {
    if (!listing || isUnavailable || isOutOfStock) return;
    setAddBusy(true);
    try {
      await addItem(listing.id, quantity);
    } catch {
      // CartContext rolls back optimistic update on error; no extra handling needed
    } finally {
      setAddBusy(false);
    }
  }, [listing, isUnavailable, isOutOfStock, addItem, quantity]);

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
        ) : listingStock != null && listingStock <= 10 ? (
          <span className="text-[12px] font-500 text-(--color-promo)">
            {dict.only_x_left.replace('%d', String(listingStock))}
          </span>
        ) : null}
      </div>

      {/* ── Primary CTA ────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isUnavailable || isOutOfStock || addBusy}
        className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-[12px] bg-(--color-cta) text-[16px] font-600 tracking-[0.02em] text-(--color-cream) transition-all hover:-translate-y-px hover:bg-(--color-cta-hover) hover:shadow-[0_4px_16px_rgba(139,111,78,0.25)] active:translate-y-0 active:bg-(--color-agate-dark) disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        aria-label={isUnavailable ? dict.unavailable : isOutOfStock ? dict.out_of_stock : `${dict.add_to_cart} ${productName}`}
      >
        <ShoppingCart className="h-5 w-5" aria-hidden="true" />
        {isUnavailable
          ? dict.unavailable
          : isOutOfStock
          ? dict.out_of_stock
          : addBusy
          ? '...'
          : listingPriceDisplay
          ? `${dict.add_to_cart} — ${listingPriceDisplay}`
          : dict.add_to_cart
        }
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

      </div>

      {/* ── External Platform Links (Etsy, etc.) ──────────────────────── */}
      {externalLinks.length > 0 && (
        <div className="flex flex-col gap-2">
          {externalLinks.map((link) => {
            const label = dict.buy_on.replace('%s', link.platform.charAt(0).toUpperCase() + link.platform.slice(1));
            return (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="nofollow noopener noreferrer sponsored"
                className="flex h-[48px] w-full items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-(--color-border) text-[14px] font-600 text-(--color-stone) transition-all hover:border-(--color-cta-hover) hover:bg-(--color-quartz-mist)"
              >
                {label}
              </a>
            );
          })}
        </div>
      )}

      {/* Cart drawer opens automatically via CartContext.addItem → setIsOpen(true) */}
    </div>
  );
}
