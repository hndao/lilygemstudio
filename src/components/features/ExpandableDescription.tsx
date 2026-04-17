'use client';

import { useRef, useEffect, useState } from 'react';

interface ExpandableDescriptionProps {
  html: string;
  seeMoreLabel: string;
  seeLessLabel: string;
  /** Max height in px before collapsing. Default: 200 */
  maxHeight?: number;
}

export function ExpandableDescription({
  html,
  seeMoreLabel,
  seeLessLabel,
  maxHeight = 400,
}: ExpandableDescriptionProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [needsClamp, setNeedsClamp] = useState(false);
  const [expanded, setExpanded]     = useState(false);

  useEffect(() => {
    if (contentRef.current) {
      setNeedsClamp(contentRef.current.scrollHeight > maxHeight + 16);
    }
  }, [html, maxHeight]);

  return (
    <div>
      <div className="relative">
        <div
          ref={contentRef}
          className="prose max-w-none text-sm leading-relaxed text-(--color-muted) [&_p]:mb-4 overflow-hidden transition-[max-height] duration-300 ease-in-out"
          style={{ maxHeight: expanded || !needsClamp ? 'none' : maxHeight }}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Fade gradient — only shown when collapsed and clamped */}
        {needsClamp && !expanded && (
          <div
            className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent, var(--color-background))',
            }}
          />
        )}
      </div>

      {needsClamp && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 inline-flex items-center rounded-full border border-(--color-border) bg-(--color-surface) px-5 py-2 text-sm font-700 text-(--color-stone) transition-colors hover:border-(--color-sand-dark) hover:bg-(--color-sand-light)"
        >
          {expanded ? seeLessLabel : seeMoreLabel}
        </button>
      )}
    </div>
  );
}
