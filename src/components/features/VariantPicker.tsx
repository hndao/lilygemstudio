'use client';

/**
 * VariantPicker — renders option type selectors from a listing's bundle product.
 *
 * Supports three display types:
 *  - text_pill    → pill buttons (size, material, etc.)
 *  - color_swatch → circular color swatches (metadata.hex)
 *  - dropdown     → native <select>
 *  - image_swatch → falls back to text_pill
 *
 * selectedOptions shape: { [optionSlug]: valueSlug }
 * e.g. { size: "57-8mm", color: "golden-silk" }
 */

interface OptionValue {
  slug: string;
  label: string;
  metadata: Record<string, string>;
}

interface OptionType {
  slug: string;
  name: string;
  displayType: 'color_swatch' | 'text_pill' | 'image_swatch' | 'dropdown';
  values: OptionValue[];
}

interface VariantPickerProps {
  options: OptionType[];
  selected: Record<string, string>;
  onChange: (optionSlug: string, valueSlug: string) => void;
}

export function VariantPicker({ options, selected, onChange }: VariantPickerProps) {
  if (!options || options.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {options.map((option) => (
        <div key={option.slug}>
          <p className="mb-2 text-[13px] font-500 text-(--color-stone-light)">
            {option.name}
            {selected[option.slug] && (
              <span className="ml-2 font-600 text-(--color-stone)">
                — {option.values.find((v) => v.slug === selected[option.slug])?.label}
              </span>
            )}
          </p>

          {option.displayType === 'color_swatch' ? (
            <div className="flex flex-wrap gap-2">
              {option.values.map((val) => {
                const hex = val.metadata?.hex;
                const isSelected = selected[option.slug] === val.slug;
                return (
                  <button
                    key={val.slug}
                    type="button"
                    onClick={() => onChange(option.slug, val.slug)}
                    title={val.label}
                    aria-label={val.label}
                    aria-pressed={isSelected}
                    className={[
                      'h-8 w-8 rounded-full border-2 transition-all',
                      isSelected
                        ? 'border-(--color-cta) scale-110 shadow-[0_0_0_2px_var(--color-surface),0_0_0_4px_var(--color-cta)]'
                        : 'border-(--color-border) hover:scale-105',
                    ].join(' ')}
                    style={hex ? { backgroundColor: hex } : undefined}
                  />
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
              {option.values.map((val) => (
                <option key={val.slug} value={val.slug}>{val.label}</option>
              ))}
            </select>
          ) : (
            /* text_pill and image_swatch both render as pills */
            <div className="flex flex-wrap gap-2">
              {option.values.map((val) => {
                const isSelected = selected[option.slug] === val.slug;
                return (
                  <button
                    key={val.slug}
                    type="button"
                    onClick={() => onChange(option.slug, val.slug)}
                    aria-pressed={isSelected}
                    className={[
                      'rounded-[8px] border-[1.5px] px-4 py-1.5 text-[13px] font-500 transition-all',
                      isSelected
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
