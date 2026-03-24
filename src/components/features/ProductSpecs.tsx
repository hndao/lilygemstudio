/**
 * ProductSpecs — renders category-driven custom fields for a product.
 *
 * WHY RSC: data is already available on the product object — no extra fetch needed.
 * LAYOUT: stacked on mobile (full-width key/value rows), two-column grid on desktop.
 * ACCESSIBILITY: uses <dl> (definition list) — correct semantic HTML for key/value specs.
 *
 * When customFieldDefinitions are provided the component will:
 *  - Use the definition's label instead of the raw snake_case key
 *  - Append the unit to number values (e.g. "60 mm")
 *  - Render a color swatch (filled circle + name) for color-type fields
 *  - Group fields under named sub-headers when more than one group exists
 */

import type { ReactNode } from 'react';
import type { CustomFieldDefinition, ColorFieldValue } from '@/types';

type FieldValue = string | number | boolean | ColorFieldValue;

interface ProductSpecsProps {
  customFields: Record<string, FieldValue>;
  customFieldDefinitions?: CustomFieldDefinition[];
  className?: string;
}

export function ProductSpecs({ customFields, customFieldDefinitions, className = '' }: ProductSpecsProps) {
  const entries = Object.entries(customFields).filter(([, v]) => v !== null && v !== undefined && v !== '');

  if (entries.length === 0) return null;

  // Build lookup map: field key → definition
  const defMap = new Map<string, CustomFieldDefinition>(
    (customFieldDefinitions ?? []).map((d) => [d.name, d]),
  );

  // Group entries by their definition's group, falling back to 'Specifications'
  const groups = new Map<string, Array<{ key: string; value: FieldValue; def?: CustomFieldDefinition }>>();
  for (const [key, value] of entries) {
    const def = defMap.get(key);
    const groupName = def?.group ?? 'Specifications';
    if (!groups.has(groupName)) groups.set(groupName, []);
    groups.get(groupName)!.push({ key, value, def });
  }

  const multipleGroups = groups.size > 1;

  return (
    <section
      className={`rounded-lg border border-(--color-sand-dark) bg-(--color-cream) p-5 ${className}`}
      aria-label="Product Specifications"
    >
      <h2 className="mb-4 font-heading text-base font-600 uppercase tracking-widest text-(--color-stone)">
        Specifications
      </h2>
      <div className={multipleGroups ? 'flex flex-col gap-5' : undefined}>
        {Array.from(groups.entries()).map(([groupName, groupEntries]) => (
          <div key={groupName}>
            {multipleGroups && (
              <h3 className="mb-2 text-[11px] font-700 uppercase tracking-widest text-(--color-cta)">
                {groupName}
              </h3>
            )}
            <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              {groupEntries.map(({ key, value, def }) => (
                <div key={key} className="flex flex-col gap-0.5">
                  <dt className="text-[11px] font-600 uppercase tracking-wider text-(--color-muted)">
                    {def?.label ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </dt>
                  <dd className="text-sm font-500 text-(--color-stone)">
                    {renderValue(value, def)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}

function renderValue(value: FieldValue, def?: CustomFieldDefinition): ReactNode {
  if (def?.type === 'color' && isColorValue(value)) {
    return (
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block h-3.5 w-3.5 flex-shrink-0 rounded-full border border-(--color-border)"
          style={{ backgroundColor: value.hex }}
          aria-hidden="true"
        />
        {value.name}
      </span>
    );
  }

  if (typeof value === 'boolean') return value ? 'Yes' : 'No';

  const str = String(value);
  return def?.unit ? `${str} ${def.unit}` : str;
}

function isColorValue(value: FieldValue): value is ColorFieldValue {
  return typeof value === 'object' && value !== null && 'hex' in value && 'name' in value;
}
