/**
 * ExpertVerdict — "DARIIV Verdict" authority box on the product detail page.
 *
 * WHY THIS EXISTS: E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
 * signals are critical for affiliate sites. A named verdict with a numeric score and a
 * persona badge communicates editorial independence and builds purchase confidence.
 *
 * DESIGN: Warm cream background (#F9F5F0) + sand border — visually distinct from the
 * page background (#FDF8F2) without using a jarring colour. Playfair italic for the
 * summary evokes editorial authority (think Wirecutter, NYT Cooking).
 */

import { Star } from 'lucide-react';
import type { ProductVerdict } from '@/types';

interface ExpertVerdictProps {
  verdict: ProductVerdict;
  className?: string;
}

/** Renders 5 stars, filling them proportionally to `score` (0–5). */
function ScoreDots({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`DARIIV score: ${score} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5"
          style={{
            fill: i < Math.round(score) ? 'var(--color-sage)' : 'transparent',
            color: 'var(--color-sage)',
          }}
          aria-hidden="true"
        />
      ))}
      <span className="ml-1 text-xs font-600 text-(--color-sage)">{score.toFixed(1)}</span>
    </div>
  );
}

export function ExpertVerdict({ verdict, className = '' }: ExpertVerdictProps) {
  return (
    <aside
      aria-label="DARIIV Expert Verdict"
      className={[
        'rounded-xl border border-[#EAD8C0] bg-[#F9F5F0] p-5',
        className,
      ].join(' ')}
    >
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Star
            className="h-4 w-4 shrink-0 text-(--color-sage)"
            fill="var(--color-sage)"
            aria-hidden="true"
          />
          <span className="font-heading text-xs font-700 uppercase tracking-widest text-(--color-stone)">
            DARIIV Verdict
          </span>
        </div>
        <ScoreDots score={verdict.score} />
      </div>

      {/* Summary — Playfair italic for editorial authority */}
      <p className="font-serif text-sm italic leading-relaxed text-(--color-stone)">
        "{verdict.summary}"
      </p>

      {/* Ideal-for badge */}
      {verdict.ideal_for && (
        <div className="mt-3">
          <span className="inline-block rounded-full border border-(--color-sand-dark) bg-(--color-sand-light) px-3 py-1 text-[11px] font-600 uppercase tracking-wider text-(--color-stone)">
            Ideal for: {verdict.ideal_for}
          </span>
        </div>
      )}
    </aside>
  );
}

