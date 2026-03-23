'use client';

/**
 * MobileCartSheet — Bottom sheet for size/quantity selection on mobile.
 *
 * TRIGGER: Tapping "Thêm vào giỏ" in the mobile sticky bar opens this sheet.
 *
 * SPECS (from mockup Section 05):
 *  - Border-radius: 16px 16px 0 0
 *  - Background: #F7F4F0 (Warm Ivory)
 *  - Max-height: 60vh
 *  - Drag handle: 40×4px, #D4C5B0
 *  - Animation: slide up 300ms ease-out
 *  - Overlay: rgba(26,26,26,0.4)
 */

import { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { addToCart } from '@/lib/cart';
import type { Money } from '@/types';

interface MobileCartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productSlug: string;
  productName: string;
  price: Money;
  coverImage: string;
  defaultSize?: string;
}

const BRACELET_SIZES = ['52mm', '54mm', '57.8mm', '60mm', '63mm'];

export function MobileCartSheet({
  isOpen,
  onClose,
  productId,
  productSlug,
  productName,
  price,
  coverImage,
  defaultSize,
}: MobileCartSheetProps) {
  const [selectedSize, setSelectedSize] = useState<string>(defaultSize ?? '');
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleConfirm = useCallback(() => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    addToCart({
      productId,
      slug: productSlug,
      name: productName,
      size: selectedSize,
      quantity,
      price,
      image: coverImage,
    });
    onClose();
  }, [selectedSize, quantity, productId, productSlug, productName, price, coverImage, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[150] bg-black/40 transition-opacity duration-300"
        onClick={onClose}
        aria-label="Đóng"
      />

      {/* Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-[160] animate-[slideUp_0.3s_ease-out] rounded-t-[16px] bg-(--color-background) p-5 pb-[max(20px,env(safe-area-inset-bottom))]"
        style={{ maxHeight: '60vh' }}
        role="dialog"
        aria-modal="true"
        aria-label="Chọn size và số lượng"
      >
        {/* Drag handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-(--color-sand-dark)" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-(--color-stone-light) hover:bg-(--color-quartz-mist)"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>

        <p className="mb-3 text-sm font-600 text-(--color-stone)">Chọn size vòng tay</p>

        {/* Size pills */}
        <div className="mb-4 flex flex-wrap gap-2">
          {BRACELET_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => { setSelectedSize(size); setSizeError(false); }}
              className={[
                'rounded-[20px] border-[1.5px] px-[18px] py-2 text-[13px] font-500 transition-all',
                selectedSize === size
                  ? 'border-(--color-cta) bg-(--color-quartz-mist) text-(--color-cta)'
                  : sizeError
                    ? 'border-red-400 text-(--color-stone-light)'
                    : 'border-(--color-border) text-(--color-stone-light)',
              ].join(' ')}
            >
              {size}
            </button>
          ))}
        </div>
        {sizeError && (
          <p className="mb-3 text-xs text-red-500">Vui lòng chọn size</p>
        )}

        {/* Quantity */}
        <div className="mb-5 flex items-center gap-3.5">
          <span className="text-[13px] font-500 text-(--color-stone-light)">Số lượng</span>
          <div className="inline-flex items-center overflow-hidden rounded-[8px] border-[1.5px] border-(--color-border)">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-10 w-10 items-center justify-center text-lg text-(--color-stone-light) hover:bg-(--color-quartz-mist)"
            >
              −
            </button>
            <div className="flex h-10 w-12 items-center justify-center border-x-[1.5px] border-(--color-border) text-[15px] font-600">
              {quantity}
            </div>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              className="flex h-10 w-10 items-center justify-center text-lg text-(--color-stone-light) hover:bg-(--color-quartz-mist)"
            >
              +
            </button>
          </div>
        </div>

        {/* Confirm button */}
        <button
          type="button"
          onClick={handleConfirm}
          className="flex h-12 w-full items-center justify-center rounded-[12px] bg-(--color-cta) text-sm font-600 text-(--color-cream) transition-all hover:bg-(--color-cta-hover) active:bg-(--color-agate-dark)"
        >
          Xác nhận — {price.formatted}
        </button>
      </div>
    </>
  );
}
