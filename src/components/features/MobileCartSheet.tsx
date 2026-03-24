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
import { addToCart } from '@/lib/cart';
import { ColorSwatches } from './ColorSwatches';
import type { Dictionary } from '@/lib/i18n';
import type { ColorOption, Money } from '@/types';

interface MobileCartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productSlug: string;
  productName: string;
  price: Money;
  coverImage: string;
  colorOptions?: ColorOption[];
  /** null = unlimited; 0 = out of stock; >0 = capped */
  stockQuantity?: number | null;
  dict: Dictionary['buybox'];
}

export function MobileCartSheet({
  isOpen,
  onClose,
  productId,
  productSlug,
  productName,
  price,
  coverImage,
  colorOptions,
  stockQuantity,
  dict,
}: MobileCartSheetProps) {
  const maxQty = stockQuantity != null ? stockQuantity : 99;
  const isOutOfStock = stockQuantity === 0;
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(
    colorOptions?.find((c) => c.in_stock !== false) ?? null,
  );
  const [quantity, setQuantity] = useState(isOutOfStock ? 0 : 1);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleConfirm = useCallback(() => {
    addToCart({
      productId,
      slug: productSlug,
      name: productName,
      colorSlug: selectedColor?.slug,
      quantity,
      price,
      image: coverImage,
    });
    onClose();
  }, [selectedColor, quantity, productId, productSlug, productName, price, coverImage, onClose]);

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

        {/* Color swatches (sm size for mobile) */}
        {colorOptions && colorOptions.length > 1 && (
          <ColorSwatches
            label={dict.color_label}
            colors={colorOptions}
            selected={selectedColor}
            onSelect={setSelectedColor}
            size="sm"
            className="mb-5"
          />
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
          ) : stockQuantity != null && stockQuantity <= 10 ? (
            <span className="text-[12px] font-500 text-(--color-promo)">
              {dict.only_x_left.replace('%d', String(stockQuantity))}
            </span>
          ) : null}
        </div>

        {/* Confirm */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isOutOfStock}
          className="flex h-12 w-full items-center justify-center rounded-[12px] bg-(--color-cta) text-sm font-600 text-(--color-cream) transition-all hover:bg-(--color-cta-hover) active:bg-(--color-agate-dark) disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isOutOfStock ? dict.out_of_stock : `${dict.confirm} — ${price.formatted}`}
        </button>
      </div>
    </>
  );
}
