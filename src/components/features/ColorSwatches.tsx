'use client';

/**
 * ColorSwatches — interactive multi-color picker.
 *
 * Desktop: 42×42px dots (default).
 * Mobile / sheet: 32×32px dots via size="sm".
 *
 * Selected dot: accent border + double-ring shadow matching mockup:
 *   border: 2.5px var(--color-cta)
 *   box-shadow: 0 0 0 2.5px bg, 0 0 0 5px cta
 *
 * Out-of-stock: opacity-40, cursor-not-allowed, input disabled.
 * Selected color name appears inline next to the label (right-aligned).
 * Renders nothing when colors.length <= 1 (single color has no selection UI).
 */

import type { ColorOption } from '@/types';

interface ColorSwatchesProps {
  label: string;
  colors: ColorOption[];
  selected: ColorOption | null;
  onSelect: (color: ColorOption) => void;
  /** sm = 32px (mobile/sheet), md = 42px (desktop default) */
  size?: 'sm' | 'md';
  className?: string;
}

export function ColorSwatches({
  label,
  colors,
  selected,
  onSelect,
  size = 'md',
  className = '',
}: ColorSwatchesProps) {
  if (colors.length <= 1) return null;

  const dotSize = size === 'sm' ? 'h-8 w-8' : 'h-[42px] w-[42px]';

  return (
    <div className={className}>
      {/* Label row: field label left, selected name right */}
      <div className="mb-[10px] flex items-center text-[13px] font-600 text-(--color-stone-light)">
        {label}
        {selected && (
          <span className="ml-auto text-[12px] font-500 text-(--color-cta)">{selected.name}</span>
        )}
      </div>

      {/* Swatch dots */}
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => {
          const isSelected = selected?.slug === color.slug;
          const outOfStock = color.in_stock === false;

          return (
            <label
              key={color.slug}
              title={color.name}
              className={outOfStock ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}
            >
              <input
                type="radio"
                name="color"
                value={color.slug}
                checked={isSelected}
                onChange={() => { if (!outOfStock) onSelect(color); }}
                disabled={outOfStock}
                className="sr-only"
              />
              <div
                className={[
                  dotSize,
                  'rounded-full border-[2.5px] transition-all duration-[0.25s]',
                  isSelected
                    ? 'border-(--color-cta) shadow-[0_0_0_2.5px_var(--color-background),0_0_0_5px_var(--color-cta)]'
                    : 'border-transparent hover:scale-[1.08]',
                ].join(' ')}
                style={{
                  background: color.hex_secondary
                    ? `linear-gradient(135deg, ${color.hex_secondary}, ${color.hex})`
                    : color.hex,
                }}
                aria-hidden="true"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
