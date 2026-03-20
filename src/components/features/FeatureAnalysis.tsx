/**
 * FeatureAnalysis — Objectivity split (Pros & Cons) on the product detail page.
 *
 * WHY TWO COLUMNS: Side-by-side layout lets users make a quick visual scan and
 * mirrors the mental model of "weighing options" — a proven conversion pattern
 * for high-consideration purchases (e.g., Wirecutter, Consumer Reports).
 *
 * MOBILE: Stacks vertically — Pros first (green tint), Cons below (gray tint).
 * DESKTOP: 2-column grid with equal widths.
 *
 * WHY NO RED: Red carries strong negative connotations that can kill purchase intent.
 * Stone gray communicates "honest limitation" without signalling danger.
 */

import { CheckCircle2, MinusCircle } from 'lucide-react';
import type { ProductProsCons } from '@/types';

interface FeatureAnalysisProps {
  pros_cons: ProductProsCons;
  className?: string;
}

function ProsList({ items }: { items: string[] }) {
  return (
    <div className="rounded-xl bg-[#EFF4E8] p-5">
      <h3 className="mb-3 font-heading text-xs font-700 uppercase tracking-widest text-(--color-sage-dark)">
        What We Love
      </h3>
      <ul className="space-y-2.5">
        {items.map((pro, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-(--color-sage)"
              aria-hidden="true"
            />
            <span className="text-sm leading-relaxed text-(--color-stone)">{pro}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConsList({ items }: { items: string[] }) {
  return (
    <div className="rounded-xl bg-[#F0EEEC] p-5">
      <h3 className="mb-3 font-heading text-xs font-700 uppercase tracking-widest text-(--color-stone-light)">
        Consider This
      </h3>
      <ul className="space-y-2.5">
        {items.map((con, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <MinusCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-(--color-muted)"
              aria-hidden="true"
            />
            <span className="text-sm leading-relaxed text-(--color-stone)">{con}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FeatureAnalysis({ pros_cons, className = '' }: FeatureAnalysisProps) {
  const { pros, cons } = pros_cons;

  if (!pros?.length && !cons?.length) return null;

  return (
    <section aria-labelledby="feature-analysis-heading" className={className}>
      <h2
        id="feature-analysis-heading"
        className="mb-4 font-serif text-xl text-(--color-stone)"
      >
        Our Honest Take
      </h2>

      {/* Stack on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {pros.length > 0 && <ProsList items={pros} />}
        {cons.length > 0 && <ConsList items={cons} />}
      </div>
    </section>
  );
}

