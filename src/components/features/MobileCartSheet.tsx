'use client';

/**
 * MobileCartSheet — Bottom sheet for color selection and quantity on mobile.
 *
 * TRIGGER: Tapping "Thêm vào giỏ" in the mobile sticky bar.
 *
 * v2.1 changes: size pills removed, color swatches added.
 * ColorSwatches (size="sm" — 32px) render at the top when colorOptions present.
 */

import { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { VariantPicker } from './VariantPicker';
import type { Dictionary } from '@/lib/i18n';
import type { ListingCard } from '@/types';

interface MobileCartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productSlug: string;
  productName: string;
  coverImage: string;
  /** null = unlimited; 0 = out of stock; >0 = capped */
  stockQuantity?: number | null;
  dict: Dictionary['buybox'];
  /** Active direct listing — required for API cart. null = unavailable. */
  listing?: ListingCard | null;
}

export function MobileCartSheet({
  isOpen,
  onClose,
  productId,
  productSlug,
  productName,
  coverImage,
  stockQuantity,
  dict,
  listing,
}: MobileCartSheetProps) {
  const { addItem } = useCart();
  const effectiveMax   = Math.min(listing?.quantity ?? Infinity, stockQuantity ?? Infinity);
  const maxQty         = isFinite(effectiveMax) ? effectiveMax : 99;
  const hasKnownStock  = isFinite(effectiveMax);
  const isUnavailable  = listing === null;
  const isOutOfStock   = hasKnownStock && maxQty === 0;

  const allOptions = listing?.bundleProducts.flatMap((p) => p.options ?? []) ?? [];
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() =>
    Object.fromEntries(allOptions.map((opt) => [opt.slug, opt.values[0]?.slug ?? '']))
  );
  const [quantity, setQuantity] = useState((isUnavailable || isOutOfStock) ? 0 : 1);
  const [addBusy, setAddBusy]   = useState(false);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleConfirm = useCallback(async () => {
    if (!listing || isUnavailable || isOutOfStock) return;
    setAddBusy(true);
    try {
      await addItem(listing.id, quantity);
      onClose();
    } catch {
      // CartContext handles optimistic rollback
    } finally {
      setAddBusy(false);
    }
  }, [listing, isUnavailable, isOutOfStock, addItem, quantity, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[150] bg-black/40 transition-opacity duration-300"
        onClick={onClose}
        aria-label={dict.close}
      />

      {/* Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-[160] animate-[slideUp_0.3s_ease-out] rounded-t-[16px] bg-(--color-background) p-5 pb-[max(20px,env(safe-area-inset-bottom))]"
        style={{ maxHeight: '60vh', overflowY: 'auto' }}
        role="dialog"
        aria-modal="true"
        aria-label={dict.sheet_title}
      >
        {/* Drag handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-(--color-sand-dark)" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-(--color-stone-light) hover:bg-(--color-quartz-mist)"
          aria-label={dict.close}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Variant picker */}
        {allOptions.length > 0 && (
          <div className="mb-5">
            <VariantPicker
              options={allOptions}
              selected={selectedOptions}
              onChange={(slug, val) => setSelectedOptions((prev) => ({ ...prev, [slug]: val }))}
            />
          </div>
        )}

        {/* Quantity */}
        <div className="mb-5 flex flex-wrap items-center gap-3.5">
          <span className="text-[13px] font-500 text-(--color-stone-light)">{dict.quantity}</span>
          <div className="inline-flex items-center overflow-hidden rounded-[8px] border-[1.5px] border-(--color-border)">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={isOutOfStock || quantity <= 1}
              className="flex h-10 w-10 items-center justify-center text-lg text-(--color-stone-light) hover:bg-(--color-quartz-mist) disabled:opacity-40 disabled:cursor-not-allowed"
            >
              −
            </button>
            <div className="flex h-10 w-12 items-center justify-center border-x-[1.5px] border-(--color-border) text-[15px] font-600">
              {isOutOfStock ? 0 : quantity}
            </div>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              disabled={isOutOfStock || quantity >= maxQty}
              className="flex h-10 w-10 items-center justify-center text-lg text-(--color-stone-light) hover:bg-(--color-quartz-mist) disabled:opacity-40 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
          {isOutOfStock ? (
            <span className="text-[12px] font-600 text-red-500">{dict.out_of_stock}</span>
          ) : hasKnownStock && maxQty <= 10 ? (
            <span className="text-[12px] font-500 text-(--color-promo)">
              {dict.only_x_left.replace('%d', String(maxQty))}
            </span>
          ) : null}
        </div>

        {/* Confirm */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isUnavailable || isOutOfStock || addBusy}
          className="flex h-12 w-full items-center justify-center rounded-[12px] bg-(--color-cta) text-sm font-600 text-(--color-cream) transition-all hover:bg-(--color-cta-hover) active:bg-(--color-agate-dark) disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUnavailable
            ? dict.unavailable
            : isOutOfStock
            ? dict.out_of_stock
            : addBusy
            ? '...'
            : listing
            ? `${dict.confirm} — ${listing.formattedPriceVnd ?? listing.formattedPrice ?? ''}`
            : dict.confirm
          }
        </button>
      </div>
    </>
  );
}
