/**
 * ProductSpecs — renders the "Product Specs" group from category-driven custom fields.
 *
 * WHY RSC: data is already available on the product object — no extra fetch needed.
 * LAYOUT: stacked on mobile (full-width key/value rows), two-column grid on desktop.
 * ACCESSIBILITY: uses <dl> (definition list) — correct semantic HTML for key/value specs.
 */

interface ProductSpecsProps {
  customFields: Record<string, string | number | boolean>;
  className?: string;
}

export function ProductSpecs({ customFields, className = '' }: ProductSpecsProps) {
  const entries = Object.entries(customFields).filter(([, v]) => v !== null && v !== undefined && v !== '');

  if (entries.length === 0) return null;

  return (
    <section className={`rounded-lg border border-(--color-sand-dark) bg-(--color-cream) p-5 ${className}`} aria-label="Product Specifications">
      <h2 className="mb-4 font-heading text-base font-600 uppercase tracking-widest text-(--color-stone)">
        Specifications
      </h2>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex flex-col gap-0.5">
            <dt className="text-[11px] font-600 uppercase tracking-wider text-(--color-muted)">
              {/* Convert snake_case key to Title Case for display fallback */}
              {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </dt>
            <dd className="text-sm font-500 text-(--color-stone)">
              {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
