'use client';

/**
 * ProductVNPanel — client wrapper that holds variant selection state.
 *
 * Render order:
 *   1. VariantPicker — option type selectors from listing.bundleProducts[0].options
 *   2. ProductBuyBox — qty + cart + Zalo/Messenger/Wishlist
 */

import { useState, useEffect } from 'react';
import { VariantPicker } from './VariantPicker';
import { ProductBuyBox } from './ProductBuyBox';
import { useProductColor } from '@/context/ProductColorContext';
import type { Dictionary } from '@/lib/i18n';
import type { ListingCard, Money } from '@/types';

interface ProductVNPanelProps {
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
  preferVnd?: boolean;
}

export function ProductVNPanel({
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
  preferVnd = true,
}: ProductVNPanelProps) {
  // Collect option types from all bundle products, deduplicated by slug.
  // (Multiple bundle products may share the same option type slug, e.g. "color".)
  const allOptions = listing
    ? Array.from(
        new Map(
          listing.bundleProducts.flatMap((p) => p.options ?? []).map((opt) => [opt.slug, opt]),
        ).values(),
      )
    : [];

  // selectedOptions: { [optionTypeSlug]: valueSlug }
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    // Default each option to its first value
    return Object.fromEntries(allOptions.map((opt) => [opt.slug, opt.values[0]?.slug ?? '']));
  });

  const { setActiveTag } = useProductColor();

  // Pre-filter gallery to the first color_swatch value on initial render
  useEffect(() => {
    const colorOption = allOptions.find((o) => o.displayType === 'color_swatch');
    const defaultSlug = colorOption?.values[0]?.slug;
    if (defaultSlug) setActiveTag(defaultSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOptionChange = (optionSlug: string, valueSlug: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionSlug]: valueSlug }));

    // When a color_swatch option changes, use the value slug as the gallery tag key
    const option = allOptions.find((o) => o.slug === optionSlug);
    if (option?.displayType === 'color_swatch') {
      setActiveTag(valueSlug || null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <VariantPicker
        options={allOptions}
        selected={selectedOptions}
        onChange={handleOptionChange}
      />

      <ProductBuyBox
        productId={productId}
        productSlug={productSlug}
        productName={productName}
        price={price}
        priceVnd={priceVnd}
        zaloUrl={zaloUrl}
        messengerUrl={messengerUrl}
        coverImage={coverImage}
        stockQuantity={stockQuantity}
        dict={dict}
        listing={listing}
        preferVnd={preferVnd}
        selectedOptions={selectedOptions}
      />
    </div>
  );
}
