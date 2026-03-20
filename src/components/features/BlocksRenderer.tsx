/**
 * BlocksRenderer — dynamically renders AI-generated product content blocks.
 *
 * WHY DISCRIMINATED UNION: TypeScript narrows the `data` type correctly inside
 * each `case`, giving full autocomplete and zero "property may not exist" errors.
 *
 * BLOCK TYPES:
 *  hero       — large editorial headline, used as a "story" introduction
 *  spec_table — minimalist spec grid; border-b only (no heavy borders per spec)
 *  split      — text + image side-by-side, image_position drives layout order
 *
 * MOBILE: spec_table collapses into a native <details>/<summary> accordion to
 * reduce scroll fatigue on small screens without a third-party dependency.
 */

import type { ProductBlock, HeroBlockData, SpecTableBlockData, SplitProductBlockData } from '@/types';

// ── Individual block renderers ─────────────────────────────────────────────────

function HeroBlock({ data }: { data: HeroBlockData }) {
  return (
    <section className="py-8 text-center">
      <p className="mb-2 font-heading text-xs font-700 uppercase tracking-widest text-(--color-sage)">
        {data.subheadline}
      </p>
      <h2 className="font-serif text-2xl leading-snug text-(--color-stone) md:text-3xl">
        {data.headline}
      </h2>
      {data.body && (
        <p className="mx-auto mt-4 max-w-prose text-sm leading-relaxed text-(--color-muted)">
          {data.body}
        </p>
      )}
    </section>
  );
}

function SpecTableBlock({ data }: { data: SpecTableBlockData }) {
  const rows = data.specs ?? [];
  if (!rows.length) return null;

  const tableContent = (
    <dl>
      {rows.map(({ label, value }, i) => (
        <div
          key={i}
          className={[
            'flex items-baseline justify-between gap-4 py-3',
            i < rows.length - 1 ? 'border-b border-(--color-border)' : '',
          ].join(' ')}
        >
          <dt className="text-xs font-600 uppercase tracking-wider text-(--color-muted)">
            {label}
          </dt>
          <dd className="text-right text-sm text-(--color-stone)">{value}</dd>
        </div>
      ))}
    </dl>
  );

  return (
    <section className="py-4">
      {/* Desktop: always visible */}
      <div className="hidden md:block">
        <h3 className="mb-4 font-heading text-xs font-700 uppercase tracking-widest text-(--color-stone)">
          {data.heading}
        </h3>
        {tableContent}
      </div>

      {/* Mobile: collapsible accordion via native <details> (no JS dependency) */}
      <details className="group md:hidden" open>
        <summary className="flex cursor-pointer list-none items-center justify-between py-3 font-heading text-xs font-700 uppercase tracking-widest text-(--color-stone)">
          {data.heading}
          <span className="ml-2 text-(--color-muted) transition-transform group-open:rotate-180">▾</span>
        </summary>
        <div className="pt-1">{tableContent}</div>
      </details>
    </section>
  );
}

function SplitBlock({ data }: { data: SplitProductBlockData }) {
  return (
    <section className="py-6">
      <div className={[
        'flex flex-col gap-6',
        data.image_position === 'left' ? 'md:flex-row-reverse' : 'md:flex-row',
      ].join(' ')}>
        <div className="flex-1">
          <h2 className="mb-3 font-serif text-xl text-(--color-stone) md:text-2xl">
            {data.heading}
          </h2>
          <p className="text-sm leading-relaxed text-(--color-muted)">{data.body}</p>
        </div>
      </div>
    </section>
  );
}

// ── Main renderer ──────────────────────────────────────────────────────────────

interface BlocksRendererProps {
  blocks: ProductBlock[];
  className?: string;
}

export function BlocksRenderer({ blocks, className = '' }: BlocksRendererProps) {
  if (!blocks?.length) return null;

  return (
    <div className={`divide-y divide-(--color-border) ${className}`}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'hero':       return <HeroBlock       key={i} data={block.data} />;
          case 'spec_table': return <SpecTableBlock  key={i} data={block.data} />;
          case 'split':      return <SplitBlock      key={i} data={block.data} />;
          default:           return null;
        }
      })}
    </div>
  );
}

