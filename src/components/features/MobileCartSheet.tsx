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
            <span className="inline-flex items-center gap-1 text-[12px] font-600 text-orange-500">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32C8.9 6.4 8.17 10.07 9.45 12.78c.14.3.08.68-.17.89-.26.2-.62.2-.87-.02-.1-.08-.18-.17-.24-.27-1.06-1.64-.7-3.58.24-5.06-1.7 1.13-2.71 3.13-2.86 5.08-.04.56-.06 1.12.04 1.67.08.58.23 1.16.47 1.7.49 1.09 1.3 1.98 2.31 2.56 1.14.65 2.52.85 3.82.63 1.44-.25 2.7-1.1 3.47-2.34.84-1.32.97-2.92.57-4.37-.23-.85-.67-1.63-.96-2.44zM11.63 18.5c-.72-.17-1.34-.56-1.76-1.14-.46-.62-.6-1.41-.4-2.15.17-.65.58-1.2 1.07-1.64.12-.1.24-.2.37-.3.07.3.19.59.39.85.22.29.54.52.87.65-.14.56-.08 1.18.23 1.7.18.31.44.58.74.76.27.17.58.27.89.29-.46.52-1.09.82-1.76.95z"/></svg>
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
