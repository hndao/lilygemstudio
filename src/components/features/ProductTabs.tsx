/**
 * ProductDescription — renders the product description HTML below the fold.
 *
 * Artisan Story and Reviews tabs removed; description is shown directly
 * without a tab chrome since it is the only content section here.
 */

interface ProductDescriptionProps {
  description: string;
}

export function ProductTabs({ description }: ProductDescriptionProps) {
  if (!description) return null;

  return (
    <div className="mt-12">
      <h2 className="mb-4 font-heading text-base font-700 text-(--color-stone)">Description</h2>
      <div
        className="prose max-w-none text-sm leading-relaxed text-(--color-muted)"
        dangerouslySetInnerHTML={{ __html: description }}
      />
    </div>
  );
}

