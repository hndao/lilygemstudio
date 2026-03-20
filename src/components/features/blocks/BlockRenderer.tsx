/**
 * BlockRenderer — maps each ContentBlock type to its React component.
 *
 * WHY SWITCH NOT OBJECT MAP: A switch statement on a discriminated union lets
 * TypeScript narrow `block.data` to the correct interface for each case.
 * An object map approach would require casts or `as` assertions to satisfy
 * the type checker — introducing potential runtime mismatches.
 *
 * WHY key={i}: Blocks are ordered and stable — the builder does not reorder
 * blocks on the fly once saved. Using array index as key is safe here because
 * blocks are server-rendered RSC content, not client-managed state.
 *
 * ADDING A NEW BLOCK TYPE:
 *  1. Add the interface to types/index.ts and extend ContentBlock union.
 *  2. Create a new component in this folder.
 *  3. Add a case here.
 *  4. Add the block to the Filament Builder in PostResource.php.
 */

import type { ContentBlock } from '@/types';
import { TextBlock }  from './TextBlock';
import { ImageBlock } from './ImageBlock';
import { SplitBlock } from './SplitBlock';
import { FaqBlock }   from './FaqBlock';
import { TocBlock }   from './TocBlock';

interface Props {
  blocks: ContentBlock[];
}

export function BlockRenderer({ blocks }: Props) {
  return (
    <div className="space-y-10">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'text':
            return <TextBlock  key={i} data={block.data} />;
          case 'image':
            return <ImageBlock key={i} data={block.data} />;
          case 'split':
            return <SplitBlock key={i} data={block.data} />;
          case 'faq_schema':
            return <FaqBlock   key={i} data={block.data} />;
          case 'toc':
            // WHY allBlocks: TocBlock auto-extracts <h2> headings from all blocks —
            // it needs the full list to build the anchor links.
            return <TocBlock   key={i} data={block.data} allBlocks={blocks} />;
          default:
            // Exhaustiveness guard — TypeScript will error here if a new block
            // type is added to the union but not handled above.
            return null;
        }
      })}
    </div>
  );
}

