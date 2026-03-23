'use client';

/**
 * ProductBuyBox — Size selector, quantity picker, and 3-tier CTA buttons.
 *
 * RENDERED ONLY FOR VIETNAMESE USERS via CSS `.country-vn` toggle.
 * Global users continue to see the AffiliateCTA "Shop on Etsy" button.
 *
 * ACTION HIERARCHY (UX rationale from mockup doc Section 02):
 *  - Primary:   "Thêm vào giỏ hàng" — keeps user in-system, enables cross-sell
 *  - Secondary: "Zalo" + "Nhắn tin" — separate channels for pre-purchase consultation
 *  - Tertiary:  "Yêu thích" — wishlist for retargeting later
 *
 * SPECS: All dimensions/colors from mockup Section 05 spec table.
 */

import { useState, useCallback } from 'react';
import { Heart, MessageCircle, ShoppingCart, MessageSquare } from 'lucide-react';
import { addToCart } from '@/lib/cart';
import type { AffiliateLink, Money } from '@/types';

interface ProductBuyBoxProps {
  productId: string;
  productSlug: string;
  productName: string;
  price: Money;
  priceVnd?: Money;
  affiliateLinkVn?: AffiliateLink;
  coverImage: string;
  /** Size extracted from product name, e.g. "57.8mm" */
  defaultSize?: string;
}

/** Static size chart for bracelets — will be backend-driven in a future sprint */
const BRACELET_SIZES = ['52mm', '54mm', '57.8mm', '60mm', '63mm'];

export function ProductBuyBox({
  productId,
  productSlug,
  productName,
  price,
  priceVnd,
  affiliateLinkVn,
  coverImage,
  defaultSize,
}: ProductBuyBoxProps) {
  const [selectedSize, setSelectedSize] = useState<string>(defaultSize ?? '');
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const displayPrice = priceVnd ?? price;

  const handleAddToCart = useCallback(() => {
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
      price: displayPrice,
      image: coverImage,
    });
    // Show success toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, [selectedSize, quantity, productId, productSlug, productName, displayPrice, coverImage]);

  const handleWishlist = useCallback(() => {
    setWishlisted((prev) => !prev);
    // TODO: persist to user account when auth is available
  }, []);

  const zaloUrl = affiliateLinkVn?.url ?? '#';
  // Pre-fill Zalo message template
  const zaloHref = zaloUrl.includes('zalo.me')
    ? `${zaloUrl}?text=${encodeURIComponent(`Xin chào, tôi quan tâm đến sản phẩm "${productName}". Vui lòng tư vấn thêm.`)}`
    : zaloUrl;

  return (
    <div className="flex w-full flex-col gap-5">
      {/* ── Size Selector ─────────────────────────────────────────────── */}
      <div>
        <p className="mb-2 text-[13px] font-500 text-(--color-stone-light)">
          Size vòng tay
        </p>
        <div className="flex flex-wrap gap-2">
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
                    : 'border-(--color-border) text-(--color-stone-light) hover:border-(--color-cta-hover) hover:text-(--color-cta)',
              ].join(' ')}
            >
              {size}
            </button>
          ))}
        </div>
        {sizeError && (
          <p className="mt-1.5 text-xs text-red-500">Vui lòng chọn size</p>
        )}
      </div>

      {/* ── Quantity Picker ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3.5">
        <span className="text-[13px] font-500 text-(--color-stone-light)">Số lượng</span>
        <div className="inline-flex items-center overflow-hidden rounded-[8px] border-[1.5px] border-(--color-border)">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-10 w-10 items-center justify-center text-lg text-(--color-stone-light) transition-colors hover:bg-(--color-quartz-mist)"
            aria-label="Giảm số lượng"
          >
            −
          </button>
          <div className="flex h-10 w-12 items-center justify-center border-x-[1.5px] border-(--color-border) text-[15px] font-600 text-(--color-stone)">
            {quantity}
          </div>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
            className="flex h-10 w-10 items-center justify-center text-lg text-(--color-stone-light) transition-colors hover:bg-(--color-quartz-mist)"
            aria-label="Tăng số lượng"
          >
            +
          </button>
        </div>
      </div>

      {/* ── Primary CTA: Thêm vào giỏ hàng ───────────────────────────── */}
      <button
        type="button"
        onClick={handleAddToCart}
        className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-[12px] bg-(--color-cta) text-[16px] font-600 tracking-[0.02em] text-(--color-cream) transition-all hover:-translate-y-px hover:bg-(--color-cta-hover) hover:shadow-[0_4px_16px_rgba(139,111,78,0.25)] active:translate-y-0 active:bg-(--color-agate-dark)"
        aria-label={`Thêm ${productName} vào giỏ hàng`}
      >
        <ShoppingCart className="h-5 w-5" aria-hidden="true" />
        Thêm vào giỏ hàng
      </button>

      {/* ── Secondary Row: Zalo / Nhắn tin / Yêu thích ────────────────── */}
      <div className="flex gap-2.5">
        {/* Zalo */}
        <a
          href={zaloHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-(--color-border) py-3 text-[13px] font-600 text-(--color-stone) transition-all hover:border-(--color-cta-hover) hover:bg-(--color-quartz-mist)"
          aria-label="Liên hệ qua Zalo"
        >
          <MessageCircle className="h-[18px] w-[18px] text-(--color-zalo)" aria-hidden="true" />
          Zalo
        </a>

        {/* Nhắn tin */}
        <a
          href={`mailto:hello@lilygemstudio.com?subject=${encodeURIComponent(`Hỏi về ${productName}`)}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-(--color-border) py-3 text-[13px] font-600 text-(--color-stone) transition-all hover:border-(--color-cta-hover) hover:bg-(--color-quartz-mist)"
          aria-label="Nhắn tin"
        >
          <MessageSquare className="h-[18px] w-[18px] text-(--color-cta)" aria-hidden="true" />
          Nhắn tin
        </a>

        {/* Yêu thích */}
        <button
          type="button"
          onClick={handleWishlist}
          className={[
            'flex flex-1 items-center justify-center gap-2 rounded-[12px] border-[1.5px] py-3 text-[13px] font-600 transition-all',
            wishlisted
              ? 'border-(--color-promo) bg-(--color-promo)/10 text-(--color-promo)'
              : 'border-(--color-border) text-(--color-stone) hover:border-(--color-cta-hover) hover:bg-(--color-quartz-mist)',
          ].join(' ')}
          aria-label={wishlisted ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
        >
          <Heart
            className={`h-[18px] w-[18px] text-(--color-promo) transition-transform ${wishlisted ? 'scale-110 fill-(--color-promo)' : ''}`}
            aria-hidden="true"
          />
          Yêu thích
        </button>
      </div>

      {/* ── Success Toast ──────────────────────────────────────────────── */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 z-[200] -translate-x-1/2 animate-[slideUp_0.3s_ease-out] rounded-[12px] border border-(--color-border) bg-(--color-surface) px-5 py-3 text-sm font-600 text-(--color-stone) shadow-lg md:bottom-8">
          ✓ Đã thêm vào giỏ hàng
        </div>
      )}
    </div>
  );
}
