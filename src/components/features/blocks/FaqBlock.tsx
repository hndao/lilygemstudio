import type { FaqSchemaBlockData } from '@/types';

interface Props {
  data: FaqSchemaBlockData;
}

/**
 * Renders FAQ items as a visible Q&A section.
 *
 * WHY RENDER VISUALLY: The faq_schema block serves two purposes—it provides
 * the structured data payload for JSON-LD (FAQ rich results) AND renders the
 * content on-page so Google's E-E-A-T signal recognises the authoritative Q&A.
 * A schema-only block with no visible content is penalised as "hidden text."
 */
export function FaqBlock({ data }: Props) {
  if (!data.items?.length) return null;

  return (
    <section aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="text-xl font-bold text-(--color-stone) mb-6">
        Frequently Asked Questions
      </h2>
      <dl className="space-y-6">
        {data.items.map((item, i) => (
          <div
            key={i}
            className="border-b border-(--color-border)/30 pb-6 last:border-0 last:pb-0"
          >
            <dt className="font-semibold text-(--color-stone) mb-2">{item.question}</dt>
            <dd className="text-(--color-muted) leading-relaxed">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
