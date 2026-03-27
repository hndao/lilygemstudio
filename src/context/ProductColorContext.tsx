'use client';

/**
 * ProductColorContext — shares the active color image-tag across the
 * ProductImageGallery (left column) and ProductVNPanel/VariantPicker (right column).
 *
 * WHY CONTEXT OVER PROPS: Gallery and variant panel are siblings rendered in
 * separate RSC subtrees. Lifting state to the RSC page is impossible (RSC has
 * no useState). Passing via event/ref across RSC boundaries is fragile.
 * A context provider placed at the grid level is the idiomatic React solution —
 * both client components (Gallery + Panel) read/write the same store.
 *
 * USAGE:
 *   1. Wrap the product grid in <ProductColorProvider>
 *   2. In VariantPicker/Panel: call setActiveTag(imageTag) when a color_swatch changes
 *   3. In ProductImageGallery: read activeTag and jump to first matching slide
 */

import { createContext, useContext, useState } from 'react';

interface ProductColorContextValue {
  /** The image_tag of the currently selected color option value, or null if none */
  activeTag: string | null;
  setActiveTag: (tag: string | null) => void;
}

const ProductColorContext = createContext<ProductColorContextValue>({
  activeTag: null,
  setActiveTag: () => {},
});

export function ProductColorProvider({ children }: { children: React.ReactNode }) {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  return (
    <ProductColorContext.Provider value={{ activeTag, setActiveTag }}>
      {children}
    </ProductColorContext.Provider>
  );
}

export function useProductColor(): ProductColorContextValue {
  return useContext(ProductColorContext);
}
