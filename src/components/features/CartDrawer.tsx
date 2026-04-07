'use client';

/**
 * CartDrawer — Slide-in cart panel.
 *
 * DESKTOP (md+):  Fixed right panel, 380px wide. Slides in from right.
 * MOBILE  (<md):  Bottom sheet, max 80vh. Slides up from bottom.
 *
 * Uses Framer Motion for the animation.
 * Rendered inside CartProvider — reads from useCart().
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, ShoppingBag, Minus, Plus, Trash2, Tag, ChevronRight, Lock } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useDict } from '@/context/DictionaryContext';
import { FreeShippingBar } from '@/components/features/FreeShippingBar';
import type { CartItem } from '@/types';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatVnd(cents: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(cents);
}

function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

// ── Line item ──────────────────────────────────────────────────────────────────

function CartLineItem({ item, isVn }: { item: CartItem; isVn: boolean }) {
  const dict = useDict();
  const { updateItem, removeItem } = useCart();
  const [busy, setBusy] = useState(false);

  const unitCents = isVn
    ? (item.priceSnapshotCentsVnd ?? item.priceSnapshotCents ?? 0)
    : (item.priceSnapshotCents ?? 0);
  const lineCents = unitCents * item.quantity;
  const unitPrice = isVn ? formatVnd(lineCents) : formatUsd(lineCents);

  const handleQty = async (delta: number) => {
    const next = item.quantity + delta;
    if (next < 1) return;
    setBusy(true);
    try { await updateItem(item.id, next); }
    finally { setBusy(false); }
  };

  const handleRemove = async () => {
    setBusy(true);
    try { await removeItem(item.id); }
    finally { setBusy(false); }
  };

  // Prefer the variant-specific image stored in selectedOptions._image_src
  const coverSrc = item.selectedOptions?.['_image_src'] ?? item.listing.coverImage?.src ?? null;

  return (
    <div className={['flex gap-3 py-4 border-b border-(--color-border) last:border-none', item.outOfStock ? 'opacity-70' : ''].join(' ')}>
      {/* Thumbnail */}
      <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[10px] bg-(--color-quartz-mist)">
        {coverSrc ? (
          <Image
            src={coverSrc}
            alt={item.listing.resolvedTitle}
            fill
            sizes="72px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-(--color-sand-dark)" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-start gap-2">
          <p className="text-[13px] font-600 text-(--color-stone) leading-snug line-clamp-2 flex-1">
            {item.listing.resolvedTitle}
          </p>
          {item.outOfStock && (
            <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-700 text-red-600">
              {dict.cart.out_of_stock}
            </span>
          )}
        </div>
        {item.listing.sku && (
          <p className="text-[11px] text-(--color-sand-dark)">SKU: {item.listing.sku}</p>
        )}
        {item.selectedOptions && Object.keys(item.selectedOptions).some((k) => !k.startsWith('_')) && (
          <p className="text-[11px] text-(--color-cta) font-500">
            {Object.entries(item.selectedOptions)
              .filter(([k]) => !k.startsWith('_'))
              .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
              .join(' · ')}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2">
          {/* Qty picker */}
          <div className="inline-flex items-center rounded-[8px] border border-(--color-border)">
            <button
              type="button"
              onClick={() => handleQty(-1)}
              disabled={busy || item.quantity <= 1}
              className="flex h-8 w-8 items-center justify-center text-(--color-stone-light) hover:bg-(--color-quartz-mist) disabled:opacity-40"
              aria-label={dict.cart.remove_item}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="flex h-8 w-8 items-center justify-center border-x border-(--color-border) text-[13px] font-600">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => handleQty(1)}
              disabled={busy}
              className="flex h-8 w-8 items-center justify-center text-(--color-stone-light) hover:bg-(--color-quartz-mist) disabled:opacity-40"
              aria-label={dict.cart.item_count.replace('{n}', '+')}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Unit price */}
          <span className="text-[14px] font-700 text-(--color-terracotta-dark)">{unitPrice}</span>

          {/* Remove */}
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="flex h-8 w-8 items-center justify-center rounded-full text-(--color-sand-dark) hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
            aria-label={dict.cart.remove_item}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Coupon row ─────────────────────────────────────────────────────────────────

function CouponRow({ isVn }: { isVn: boolean }) {
  const dict = useDict();
  const { cart, applyCouponCode, removeCouponCode } = useCart();
  const [expanded, setExpanded] = useState(false);
  const [code, setCode]         = useState('');
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState('');

  const handleApply = async () => {
    if (!code.trim()) return;
    setBusy(true);
    setError('');
    try {
      await applyCouponCode(code.trim());
      setCode('');
      setExpanded(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Invalid coupon');
    } finally {
      setBusy(false);
    }
  };

  // Code-based promotion applied = a promotion with requires_code=true (isAutoApplied false + has code)
  const appliedCodePromo = cart?.promotions?.find((p) => !p.isAutoApplied && p.code);

  if (appliedCodePromo) {
    return (
      <div className="flex items-center gap-2 rounded-[10px] bg-green-50 px-3 py-2 text-[13px]">
        <Tag className="h-4 w-4 text-green-600" />
        <span className="flex-1 font-500 text-green-700">
          {dict.cart.coupon_applied.replace('{code}', appliedCodePromo.code!)}
        </span>
        <button
          type="button"
          onClick={() => removeCouponCode()}
          className="text-[12px] text-green-600 underline"
        >
          {dict.cart.coupon_remove}
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-1.5 text-[13px] text-(--color-cta) font-500"
      >
        <Tag className="h-4 w-4" />
        {dict.cart.coupon_question}
      </button>
      {expanded && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={dict.cart.coupon_placeholder}
            className="flex-1 rounded-[8px] border border-(--color-border) px-3 py-2 text-[13px] outline-none focus:border-(--color-cta)"
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          />
          <button
            type="button"
            onClick={handleApply}
            disabled={busy}
            className="rounded-[8px] bg-(--color-cta) px-4 py-2 text-[13px] font-600 text-white disabled:opacity-50"
          >
            {dict.cart.coupon_apply}
          </button>
        </div>
      )}
      {error && <p className="mt-1 text-[12px] text-red-500">{error}</p>}
    </div>
  );
}

// ── Main CartDrawer ────────────────────────────────────────────────────────────

export function CartDrawer() {
  const dict = useDict();
  const { cart, isOpen, closeCart, itemCount } = useCart();
  const pathname = usePathname();
  const lang = pathname.split('/')[1] ?? 'en';
  const hasOutOfStock = cart?.items.some((i) => i.outOfStock) ?? false;

  // Derive isVn from NEXT_COUNTRY cookie (set by middleware via Cloudflare/Vercel geo)
  const [isVn, setIsVn] = useState(false);
  useEffect(() => {
    setIsVn(document.documentElement.classList.contains('country-vn'));
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const subtotal = isVn ? (cart?.subtotalCentsVnd ?? 0) : (cart?.subtotalCents ?? 0);
  const subtotalFormatted = isVn ? formatVnd(subtotal) : formatUsd(subtotal);

  // Mobile (< md): bottom sheet — Desktop (md+): right panel
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="cart-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black/50 md:bg-black/40"
            onClick={closeCart}
            aria-hidden="true"
          />

          {/* Panel — right side on desktop, bottom on mobile */}
          <motion.div
            key="cart-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
            className={[
              'fixed top-0 right-0 z-[201] flex h-full w-full flex-col bg-(--color-surface)',
              'md:w-[390px] md:shadow-[-4px_0_24px_rgba(0,0,0,0.12)]',
              // Mobile override: bottom sheet
              'max-md:top-auto max-md:bottom-0 max-md:h-[82svh] max-md:rounded-t-[20px]',
            ].join(' ')}
            role="dialog"
            aria-modal="true"
            aria-label={dict.cart.title}
          >
            {/* Mobile drag handle */}
            <div className="mx-auto mt-3 mb-0 h-1 w-10 shrink-0 rounded-full bg-(--color-border) md:hidden" />

            {/* Header */}
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-(--color-border) px-5">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-(--color-cta)" />
                <span className="font-heading text-[16px] font-700 text-(--color-stone)">
                  {dict.cart.title}
                </span>
                {itemCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-(--color-cta) px-1.5 text-[11px] font-700 text-white">
                    {itemCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="flex h-9 w-9 items-center justify-center rounded-full text-(--color-stone-light) hover:bg-(--color-quartz-mist)"
                aria-label={dict.cart.close}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5">
              {!cart || cart.items.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-(--color-quartz-mist)">
                    <ShoppingBag className="h-10 w-10 text-(--color-sand-dark)" />
                  </div>
                  <p className="font-heading text-[16px] font-700 text-(--color-stone) mb-1">
                    {dict.cart.empty}
                  </p>
                  <p className="text-[13px] text-(--color-sand-dark) mb-6">
                    {dict.cart.empty_sub}
                  </p>
                  <Link
                    href={`/${lang}/shop`}
                    onClick={closeCart}
                    className="inline-flex items-center gap-1.5 rounded-[10px] bg-(--color-cta) px-5 py-2.5 text-[14px] font-600 text-white"
                  >
                    {dict.cart.browse_products} <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div>
                  {cart.items.map((item) => (
                    <CartLineItem key={item.id} item={item} isVn={isVn} />
                  ))}
                </div>
              )}
            </div>

            {/* Footer (only shown when cart has items) */}
            {cart && cart.items.length > 0 && (
              <div className="shrink-0 border-t border-(--color-border) px-5 pt-4 pb-[max(20px,env(safe-area-inset-bottom))]">
                {/* Free shipping upsell bar */}
                <div className="mb-3">
                  <FreeShippingBar isVn={isVn} />
                </div>

                {/* Coupon */}
                <div className="mb-3">
                  <CouponRow isVn={isVn} />
                </div>

                {/* Totals */}
                <div className="mb-4 space-y-1.5 text-[13px]">
                  <div className="flex justify-between text-(--color-stone-light)">
                    <span>{dict.cart.subtotal}</span>
                    <span className="font-600 text-(--color-stone)">{subtotalFormatted}</span>
                  </div>
                  {/* Promotions discount rows */}
                  {cart.promotions?.map((promo) => promo.discountCents > 0 && (
                    <div key={promo.id} className="flex justify-between text-green-600">
                      <span>{dict.cart.promotion_discount.replace('{name}', promo.name)}</span>
                      <span className="font-600">
                        −{isVn ? formatVnd(promo.discountCents) : formatUsd(promo.discountCents)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[11px] text-(--color-sand-dark)">
                    <span>{dict.cart.shipping_fee}</span>
                    <span>{dict.cart.shipping_calculated}</span>
                  </div>
                </div>

                {/* OOS warning */}
                {hasOutOfStock && (
                  <div className="mb-3 rounded-[10px] bg-red-50 border border-red-200 px-3 py-2.5 text-[12px] text-red-600">
                    {dict.cart.oos_warning}
                  </div>
                )}

                {/* CTA */}
                {hasOutOfStock ? (
                  <div className="flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-[12px] bg-(--color-border) text-[15px] font-700 text-(--color-sand-dark)">
                    <Lock className="h-4 w-4" />
                    {dict.cart.checkout}
                  </div>
                ) : (
                  <Link
                    href={lang ? `/${lang}/checkout` : '/checkout'}
                    onClick={closeCart}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-(--color-cta) text-[15px] font-700 text-white shadow-sm transition-all hover:bg-(--color-cta-hover) active:scale-[0.98]"
                  >
                    <Lock className="h-4 w-4" />
                    {dict.cart.checkout}
                  </Link>
                )}

                {/* Trust badges */}
                <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-(--color-sand-dark)">
                  <span>{dict.checkout.trust_ssl}</span>
                  <span>·</span>
                  <span>{dict.checkout.trust_returns}</span>
                  <span>·</span>
                  <span>{dict.checkout.trust_payment}</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
