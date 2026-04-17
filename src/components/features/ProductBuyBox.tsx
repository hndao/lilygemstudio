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

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { apiToggleLike, apiGetLikeStatus } from '@/lib/auth';
import type { Dictionary } from '@/lib/i18n';
import type { Money, ListingCard, ProductDetail } from '@/types';

interface ProductBuyBoxProps {
  productId: string;
  listingSlug: string;
  productName: string;
  price: Money;
  priceVnd?: Money;
  zaloUrl?: string;
  messengerUrl?: string;
  coverImage: string;
  /** All selected variants from VariantPicker e.g. { color: 'black', size: 's' } */
  selectedOptions?: Record<string, string>;
  /** null = unlimited; 0 = out of stock; >0 = capped at this value */
  stockQuantity?: number | null;
  /** Per-combination variant stock from ProductDetail */
  variants?: ProductDetail['variants'];
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
  /** Admin-curated trust signals; empty array = fall back to plain text dict */
  trustBadges?: ProductDetail['trustBadges'];
  lang?: string;
}

export function ProductBuyBox({
  productId,
  listingSlug,
  productName,
  price,
  priceVnd,
  zaloUrl,
  messengerUrl,
  coverImage,
  selectedOptions,
  stockQuantity,
  variants,
  dict,
  listing,
  preferVnd = true,
  trustBadges,
  lang = 'en',
}: ProductBuyBoxProps) {
  const { addItem } = useCart();
  const { customer, token, openAuthModal } = useAuth();

  // ── Wishlist / like state ─────────────────────────────────────────────────
  const [liked, setLiked]             = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    if (!customer || !token) return;
    apiGetLikeStatus(listingSlug, token)
      .then(({ liked: l }) => setLiked(l))
      .catch(() => {});
  }, [customer, token, listingSlug]);

  const handleLike = useCallback(async () => {
    if (!customer) { openAuthModal(); return; }
    if (!token || likeLoading) return;
    setLikeLoading(true);
    try {
      const { liked: newLiked } = await apiToggleLike(listingSlug, token);
      setLiked(newLiked);
    } catch {
      // ignore
    } finally {
      setLikeLoading(false);
    }
  }, [customer, token, listingSlug, likeLoading, openAuthModal]);

  // Find the variant combination that matches the current selection.
  const selectedVariant = variants?.find((v) =>
    Object.entries(selectedOptions ?? {}).every(([key, val]) => v.attributes[key] === val),
  );

  // Effective max = min of listing hard cap, product-level stock, and selected-variant stock.
  // Any source that is null/undefined contributes no cap (treated as Infinity).
  const effectiveMax = Math.min(
    listing?.quantity ?? Infinity,
    stockQuantity ?? Infinity,
    selectedVariant?.quantity ?? Infinity,
  );
  const maxQty        = isFinite(effectiveMax) ? effectiveMax : 99;
  const hasKnownStock = isFinite(effectiveMax); // at least one source has a cap
  const isUnavailable = listing === null; // no active listing
  const isOutOfStock  = hasKnownStock && maxQty === 0;

  const [quantity, setQuantity]   = useState((isUnavailable || isOutOfStock) ? 0 : 1);

  // Reset quantity when the selected variant changes (e.g. switching from Black→Gold
  // may change the available stock cap).
  useEffect(() => {
    setQuantity((prev) => {
      if (isUnavailable || isOutOfStock) return 0;
      return Math.min(prev, Math.max(1, maxQty));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariant?.id]);
  const [addBusy, setAddBusy]     = useState(false);

  // Display price: respect preferVnd flag — VN users see ₫, global users see $
  const listingPriceDisplay = listing
    ? (preferVnd
        ? (listing.formattedPriceVnd ?? listing.formattedPrice)
        : (listing.formattedPrice ?? listing.formattedPriceVnd))
    : null;
  const displayPrice = preferVnd ? (priceVnd ?? price) : price;

  // Button label price = effective (promotional if active, else regular) unit price × quantity
  const buttonTotalPrice = listing
    ? (() => {
        const useVnd = preferVnd && listing.priceCentsVnd != null;
        const cents = useVnd
          ? (listing.promotionalPriceCentsVnd ?? listing.priceCentsVnd!)
          : (listing.promotionalPriceCents ?? listing.priceCents);
        if (cents == null) return listingPriceDisplay;
        return useVnd
          ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cents * quantity)
          : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents * quantity / 100);
      })()
    : null;

  // Platform links for non-direct channels (e.g. Etsy)
  const externalLinks = (listing?.platformLinks ?? []).filter(
    (l) => l.platform !== 'direct' && l.url,
  );

  const handleAddToCart = useCallback(async () => {
    if (!listing || isUnavailable || isOutOfStock) return;
    setAddBusy(true);

    // Build options payload — copy all selected variants
    const options: Record<string, string> = { ...(selectedOptions ?? {}) };

    // Find the image tagged to the selected color and embed its URL so the cart
    // can show the right thumbnail without an extra API round-trip.
    const colorSlug = options['color'];
    if (colorSlug && listing.images?.length) {
      const variantImg = listing.images.find((img) => img.tag === colorSlug);
      if (variantImg?.src) options['_image_src'] = variantImg.src;
    }

    try {
      await addItem(listing.id, quantity, Object.keys(options).length ? options : undefined);
    } catch {
      // CartContext rolls back optimistic update on error; no extra handling needed
    } finally {
      setAddBusy(false);
    }
  }, [listing, isUnavailable, isOutOfStock, addItem, quantity, selectedOptions]);

  const zaloHref = zaloUrl
    ? `${zaloUrl}?text=${encodeURIComponent(dict.zalo_text.replace('%s', productName))}`
    : '#';

  // Global users (preferVnd=false): show only external platform links + trust badges
  if (!preferVnd) {
    return (
      <div className="flex w-full flex-col gap-5">
        {externalLinks.length > 0 && (
          <div className={externalLinks.length === 1 ? 'flex' : 'grid grid-cols-2 gap-2'}>
            {externalLinks.map((link) => {
              const label = dict.buy_on.replace('%s', link.platform.charAt(0).toUpperCase() + link.platform.slice(1));
              return (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="nofollow noopener noreferrer sponsored"
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[12px] bg-(--color-cta) text-[16px] font-600 tracking-[0.02em] text-(--color-cream) transition-all hover:-translate-y-px hover:bg-(--color-cta-hover) hover:shadow-[0_4px_16px_rgba(139,111,78,0.25)] active:translate-y-0"
                >
                  {label}
                </a>
              );
            })}
          </div>
        )}

        {/* Trust Signals */}
        {trustBadges && trustBadges.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {trustBadges.map((b, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1 rounded-[10px] bg-(--color-cream) px-2 py-3 text-center"
              >
                <span className="text-[20px] leading-none">{b.icon}</span>
                <span className="text-[11px] font-600 leading-tight text-(--color-stone)">
                  {lang === 'vi' ? (b.labelVi ?? b.label) : b.label}
                </span>
                {(lang === 'vi' ? (b.subLabelVi ?? b.subLabel) : b.subLabel) && (
                  <span className="text-[10px] leading-tight text-(--color-muted)">
                    {lang === 'vi' ? (b.subLabelVi ?? b.subLabel) : b.subLabel}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4 text-xs text-(--color-muted)">
            <span>🚚 {dict.trust_shipping}</span>
            <span>✋ {dict.trust_handmade}</span>
            <span>🔄 {dict.trust_returns}</span>
          </div>
        )}
      </div>
    );
  }

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
        ) : hasKnownStock && maxQty <= 10 ? (
          <span className="inline-flex items-center gap-1 text-[12px] font-600 text-orange-500">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32C8.9 6.4 8.17 10.07 9.45 12.78c.14.3.08.68-.17.89-.26.2-.62.2-.87-.02-.1-.08-.18-.17-.24-.27-1.06-1.64-.7-3.58.24-5.06-1.7 1.13-2.71 3.13-2.86 5.08-.04.56-.06 1.12.04 1.67.08.58.23 1.16.47 1.7.49 1.09 1.3 1.98 2.31 2.56 1.14.65 2.52.85 3.82.63 1.44-.25 2.7-1.1 3.47-2.34.84-1.32.97-2.92.57-4.37-.23-.85-.67-1.63-.96-2.44zM11.63 18.5c-.72-.17-1.34-.56-1.76-1.14-.46-.62-.6-1.41-.4-2.15.17-.65.58-1.2 1.07-1.64.12-.1.24-.2.37-.3.07.3.19.59.39.85.22.29.54.52.87.65-.14.56-.08 1.18.23 1.7.18.31.44.58.74.76.27.17.58.27.89.29-.46.52-1.09.82-1.76.95z"/></svg>
            {dict.only_x_left.replace('%d', String(maxQty))}
          </span>
        ) : null}
      </div>

      {/* ── Primary CTA: Cart + Wishlist heart ────────────────────────── */}
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isUnavailable || isOutOfStock || addBusy}
          className="flex flex-1 h-[52px] items-center justify-center gap-2.5 rounded-[12px] bg-(--color-cta) text-[16px] font-600 tracking-[0.02em] text-(--color-cream) transition-all hover:-translate-y-px hover:bg-(--color-cta-hover) hover:shadow-[0_4px_16px_rgba(139,111,78,0.25)] active:translate-y-0 active:bg-(--color-agate-dark) disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          aria-label={isUnavailable ? dict.unavailable : isOutOfStock ? dict.out_of_stock : `${dict.add_to_cart} ${productName}`}
        >
          <ShoppingCart className="h-5 w-5" aria-hidden="true" />
          {isUnavailable
            ? dict.unavailable
            : isOutOfStock
            ? dict.out_of_stock
            : addBusy
            ? '...'
            : buttonTotalPrice
            ? `${dict.add_to_cart} — ${buttonTotalPrice}`
            : dict.add_to_cart
          }
        </button>

        {/* Wishlist heart button */}
        <button
          type="button"
          onClick={handleLike}
          disabled={likeLoading}
          aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={liked}
          className={[
            'flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[12px]',
            'border-[1.5px] transition-all',
            liked
              ? 'border-(--color-sand-dark) bg-(--color-cream) text-(--color-cta)'
              : 'border-(--color-border) text-(--color-stone-light) hover:border-(--color-sand-dark) hover:bg-(--color-cream) hover:text-(--color-cta)',
          ].join(' ')}
        >
          <Heart className="h-5 w-5" fill={liked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* ── External Platform Links (Etsy, etc.) — Global users only ─── */}
      {/* VN users buy via Add to Cart / Zalo / Messenger; never show external links to them */}
      {!preferVnd && externalLinks.length > 0 && (
        <div className={externalLinks.length === 1 ? 'flex' : 'grid grid-cols-2 gap-2'}>
          {externalLinks.map((link) => {
            const label = dict.buy_on.replace('%s', link.platform.charAt(0).toUpperCase() + link.platform.slice(1));
            return (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="nofollow noopener noreferrer sponsored"
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-(--color-border) text-[14px] font-600 text-(--color-stone) transition-all hover:border-(--color-cta-hover) hover:bg-(--color-quartz-mist)"
              >
                {label}
              </a>
            );
          })}
        </div>
      )}

      {/* ── Trust Signals ──────────────────────────────────────────────── */}
      {trustBadges && trustBadges.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {trustBadges.map((b, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1 rounded-[10px] bg-(--color-cream) px-2 py-3 text-center"
            >
              <span className="text-[20px] leading-none">{b.icon}</span>
              <span className="text-[11px] font-600 leading-tight text-(--color-stone)">
                {lang === 'vi' ? (b.labelVi ?? b.label) : b.label}
              </span>
              {(lang === 'vi' ? (b.subLabelVi ?? b.subLabel) : b.subLabel) && (
                <span className="text-[10px] leading-tight text-(--color-muted)">
                  {lang === 'vi' ? (b.subLabelVi ?? b.subLabel) : b.subLabel}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-4 text-xs text-(--color-muted)">
          <span>🚚 {dict.trust_shipping}</span>
          <span>✋ {dict.trust_handmade}</span>
          <span>🔄 {dict.trust_returns}</span>
        </div>
      )}

      {/* ── Zalo / Messenger consultation row ────────────────────────── */}
      {(zaloUrl || messengerUrl) && (
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
      )}

      {/* Cart drawer opens automatically via CartContext.addItem → setIsOpen(true) */}
    </div>
  );
}
