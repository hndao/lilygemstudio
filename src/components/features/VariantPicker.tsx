'use client';

/**
 * VariantPicker — renders option type selectors from a listing's bundle product.
 *
 * Supports three display types:
 *  - text_pill    → pill buttons (size, material, etc.)
 *  - color_swatch → circular color swatches (metadata.hex) + visible name label
 *  - dropdown     → native <select>
 *  - image_swatch → falls back to text_pill
 *
 * selectedOptions shape: { [optionSlug]: valueSlug }
 * e.g. { size: "57-8mm", color: "golden-silk" }
 *
 * OOS logic: a value is unavailable when every combination containing that slug
 * has isAvailable === false. Requires the `variants` prop from ProductDetailResource.
 */

interface OptionValue {
  slug: string;
  label: string;
  metadata: Record<string, string>;
}

interface OptionType {
  slug: string;
  name: string;
  fieldType: string;
  displayType: string;
  values: OptionValue[];
}

interface Variant {
  attributes: Record<string, string>;
  isAvailable: boolean;
}

interface VariantPickerProps {
  options: OptionType[];
  selected: Record<string, string>;
  onChange: (optionSlug: string, valueSlug: string) => void;
  /** Per-combination stock from product.variants — used to mark OOS values */
  variants?: Variant[];
  lang?: string;
  /** When set, renders a "Size Guide" link next to the "size" option label */
  sizeGuideLabel?: string;
}

/** Returns true when every combination containing this option value is out of stock */
function isValueOos(optionSlug: string, valueSlug: string, variants?: Variant[]): boolean {
  if (!variants || variants.length === 0) return false;
  const matching = variants.filter((v) => v.attributes[optionSlug] === valueSlug);
  if (matching.length === 0) return false;
  return matching.every((v) => !v.isAvailable);
}

export function VariantPicker({ options, selected, onChange, variants, lang = 'en', sizeGuideLabel }: VariantPickerProps) {
  if (!options || options.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {options.map((option) => (
        <div key={option.slug}>
          <p className="mb-2 flex items-center text-[13px] font-500 text-(--color-stone-light)">
            {option.name}
            {selected[option.slug] && (
              <span className="ml-2 font-600 text-(--color-stone)">
                — {option.values.find((v) => v.slug === selected[option.slug])?.label}
              </span>
            )}
            {sizeGuideLabel && option.slug === 'size' && (
              <a
                href={`/${lang}/size-guide`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-[12px] font-500 text-(--color-cta) underline underline-offset-2 hover:text-(--color-cta-hover)"
              >
                {sizeGuideLabel} →
              </a>
            )}
          </p>

          {option.displayType === 'color_swatch' ? (
            <div className="flex flex-wrap gap-3">
              {option.values.map((val) => {
                const hex = val.metadata?.hex;
                const isSelected = selected[option.slug] === val.slug;
                const isOos = isValueOos(option.slug, val.slug, variants);
                return (
                  <div key={val.slug} className="flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => !isOos && onChange(option.slug, val.slug)}
                      title={val.label}
                      aria-label={isOos ? `${val.label} (out of stock)` : val.label}
                      aria-pressed={isSelected}
                      disabled={isOos}
                      className={[
                        'h-10 w-10 rounded-full border-2 transition-all',
                        isOos
                          ? 'opacity-35 cursor-not-allowed border-(--color-border)'
                          : isSelected
                          ? 'border-(--color-cta) scale-110 shadow-[0_0_0_2px_var(--color-surface),0_0_0_4px_var(--color-cta)]'
                          : 'border-(--color-border) hover:scale-105 cursor-pointer',
                      ].join(' ')}
                      style={hex ? { backgroundColor: hex } : undefined}
                    />
                    <span className={['text-[11px] leading-tight', isOos ? 'text-(--color-border)' : 'text-(--color-muted)'].join(' ')}>
                      {val.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : option.displayType === 'dropdown' ? (
            <select
              value={selected[option.slug] ?? ''}
              onChange={(e) => onChange(option.slug, e.target.value)}
              className="w-full rounded-[8px] border-[1.5px] border-(--color-border) bg-(--color-surface) px-3 py-2 text-[14px] text-(--color-stone) focus:border-(--color-cta) focus:outline-none"
            >
              <option value="" disabled>Select {option.name}</option>
              {option.values.map((val) => {
                const isOos = isValueOos(option.slug, val.slug, variants);
                return (
                  <option key={val.slug} value={val.slug} disabled={isOos}>
                    {val.label}{isOos ? ' (hết hàng)' : ''}
                  </option>
                );
              })}
            </select>
          ) : (
            /* text_pill and image_swatch both render as pills */
            <div className="flex flex-wrap gap-2">
              {option.values.map((val) => {
                const isSelected = selected[option.slug] === val.slug;
                const isOos = isValueOos(option.slug, val.slug, variants);
                return (
                  <button
                    key={val.slug}
                    type="button"
                    onClick={() => !isOos && onChange(option.slug, val.slug)}
                    disabled={isOos}
                    aria-pressed={isSelected}
                    aria-label={isOos ? `${val.label} (out of stock)` : val.label}
                    className={[
                      'rounded-[8px] border-[1.5px] px-4 py-1.5 text-[13px] font-500 transition-all',
                      isOos
                        ? 'border-(--color-border) text-(--color-border) line-through opacity-35 cursor-not-allowed'
                        : isSelected
                        ? 'border-(--color-cta) bg-(--color-quartz-mist) font-600 text-(--color-cta)'
                        : 'border-(--color-border) text-(--color-stone) hover:border-(--color-cta-hover) hover:bg-(--color-quartz-mist)',
                    ].join(' ')}
                  >
                    {val.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
