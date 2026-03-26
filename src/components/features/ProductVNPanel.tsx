'use client';

/**
 * ProductVNPanel — VN-only client wrapper that holds selectedColor state.
 *
 * Rendered inside .geo-show-vn on the product detail page.
 * Owns the selectedColor state so ColorSwatches and ProductBuyBox
 * share the same selection without prop-drilling through the RSC page.
 *
 * Render order (matches mockup Section 01):
 *   1. ColorSwatches (if multi-color product)
 *   2. SpecsBox (specs_box fields)
 *   3. ProductBuyBox (qty + cart + Zalo/Nhắn tin/Yêu thích)
 */

import { useState } from 'react';
import { ColorSwatches } from './ColorSwatches';
import { SpecsBox } from './SpecsBox';
import { ProductBuyBox } from './ProductBuyBox';
import type { Dictionary } from '@/lib/i18n';
import type { ColorOption, FieldWithValue, ListingCard, Money } from '@/types';

interface ProductVNPanelProps {
  colorOptions?: ColorOption[];
  colorLabel?: string;
  specsBoxFields: FieldWithValue[];
  productId: string;
  productSlug: string;
  productName: string;
  price: Money;
  priceVnd?: Money;
  zaloUrl?: string;
  messengerUrl?: string;
  coverImage: string;
  stockQuantity?: number | null;
  dict: Dictionary['buybox'];
  listing?: ListingCard | null;
}

export function ProductVNPanel({
  colorOptions,
  colorLabel,
  specsBoxFields,
  productId,
  productSlug,
  productName,
  price,
  priceVnd,
  zaloUrl,
  messengerUrl,
  coverImage,
  stockQuantity,
  dict,
  listing,
}: ProductVNPanelProps) {
  // Default to first in-stock color
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(
    colorOptions?.find((c) => c.in_stock !== false) ?? null,
  );

  return (
    <div className="flex flex-col gap-5">
      {colorOptions && colorOptions.length > 1 && (
        <ColorSwatches
          label={colorLabel ?? dict.color_label}
          colors={colorOptions}
          selected={selectedColor}
          onSelect={setSelectedColor}
        />
      )}

      <SpecsBox fields={specsBoxFields} title={dict.specs_title} />

      <ProductBuyBox
        productId={productId}
        productSlug={productSlug}
        productName={productName}
        price={price}
        priceVnd={priceVnd}
        zaloUrl={zaloUrl}
        messengerUrl={messengerUrl}
        coverImage={coverImage}
        selectedColor={selectedColor}
        stockQuantity={stockQuantity}
        dict={dict}
        listing={listing}
      />
    </div>
  );
}
