/**
 * TocBlock — renders a "Table of Contents" navigation box.
 *
 * WHY AUTO-EXTRACT: TOC items are derived from <h2> headings in the article's
 * text/split blocks at render time. No manual item list to maintain — the TOC
 * stays in sync with content automatically.
 *
 * SCROLL BEHAVIOUR: Each item is an <a href="#anchor">. The matching <h2> has
 * the same id injected by TextBlock via injectHeadingIds(). scroll-behavior:smooth
 * on <html> (globals.css) makes the jump animated.
 */

import type { TocBlockData, ContentBlock } from '@/types';
import { extractTocItems } from '@/lib/toc';

interface Props {
  data: TocBlockData;
  allBlocks: ContentBlock[];
}

export function TocBlock({ data, allBlocks }: Props) {
  const items = extractTocItems(allBlocks);
  if (items.length === 0) return null;

  const title = data.title ?? "What You'll Learn in This Guide";

  return (
    <nav
      aria-label="Table of contents"
      className="rounded-xl border border-(--color-sage)/30 bg-(--color-sage)/5 px-6 py-5"
    >
      <p className="text-base font-bold text-(--color-sage) mb-2">{title}</p>

      {data.description && (
        <p className="text-sm text-(--color-muted) mb-4">{data.description}</p>
      )}

      <ol className="space-y-2 list-none">
        {items.map((item, i) => (
          <li key={i} className="text-sm">
            <a
              href={`#${item.anchor}`}
              className="text-(--color-sage) hover:underline underline-offset-2 font-medium"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
