/**
 * TextBlock — renders a prose HTML blob from a Filament text block.
 *
 * WHY dangerouslySetInnerHTML: The HTML is produced by TipTap on the server
 * via the text-block profile (no media, no scripts). The profile is strict —
 * only semantic tags are emitted: <p>, <h2–h6>, <strong>, <em>, <u>, <a>,
 * <ul>/<ol>/<li>. There is no user-supplied raw HTML; Filament sanitises the
 * TipTap output before storing it.
 *
 * WHY prose class: Tailwind Typography gives consistent line heights, margins,
 * and font sizes to raw HTML without inline styles — keeps the DOM clean for SEO.
 */

import type { TextBlockData } from '@/types';
import { injectHeadingIds } from '@/lib/toc';

interface Props {
  data: TextBlockData;
}

export function TextBlock({ data }: Props) {
  return (
    <div
      className="article-prose"
      dangerouslySetInnerHTML={{ __html: injectHeadingIds(data.html) }}
    />
  );
}
