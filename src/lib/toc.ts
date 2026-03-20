/**
 * TOC utilities — shared by TocBlock (rendering) and TextBlock (ID injection).
 *
 * WHY SHARED UTILITY: Both components need the same slugify logic so that the
 * anchor href in TocBlock (#section-slug) matches the id injected into <h2> tags
 * by TextBlock. A single source of truth prevents drift.
 *
 * WHY AUTO-EXTRACT: Storing TOC items in the block data would duplicate the
 * heading text. Auto-extracting from <h2> tags at render time keeps the TOC
 * in sync with the content automatically.
 */

import type { ContentBlock } from '@/types';

export interface TocItem {
  label: string;   // heading text (HTML-stripped)
  anchor: string;  // URL-safe id — used as href and as id on the <h2>
}

/**
 * Convert a heading text to a URL-safe anchor id.
 * Input:  "1. Why Falls Are the #1 Safety Concern for Families in 2026"
 * Output: "1-why-falls-are-the-1-safety-concern-for-families-in-2026"
 */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')  // strip non-alphanumeric (keeps spaces)
    .trim()
    .replace(/\s+/g, '-')          // spaces → hyphens
    .replace(/-+/g, '-');          // collapse consecutive hyphens
}

/**
 * Extract TOC items from all text/split blocks by scanning for <h2> tags.
 * Called by TocBlock to build the clickable list.
 */
export function extractTocItems(blocks: ContentBlock[]): TocItem[] {
  const items: TocItem[] = [];
  for (const block of blocks) {
    if (block.type !== 'text' && block.type !== 'split') continue;
    const matches = [...block.data.html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
    for (const match of matches) {
      const text = match[1].replace(/<[^>]+>/g, '').trim(); // strip inner tags
      if (text) {
        items.push({ label: text, anchor: slugifyHeading(text) });
      }
    }
  }
  return items;
}

/**
 * Inject id attributes into every <h2> in an HTML string (if not already present).
 * Called by TextBlock so anchor links in TocBlock resolve correctly.
 *
 * Before: <h2>1. Why Falls Are the #1 Safety Concern</h2>
 * After:  <h2 id="1-why-falls-are-the-1-safety-concern">1. Why Falls...</h2>
 */
export function injectHeadingIds(html: string): string {
  return html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (_, attrs: string, content: string) => {
    if (/\bid\s*=/.test(attrs)) return `<h2${attrs}>${content}</h2>`; // already has id
    const text = content.replace(/<[^>]+>/g, '').trim();
    const id = slugifyHeading(text);
    return `<h2${attrs} id="${id}">${content}</h2>`;
  });
}
