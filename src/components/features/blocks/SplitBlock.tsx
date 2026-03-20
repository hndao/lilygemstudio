/**
 * SplitBlock — floating image + wrapping text layout.
 *
 * WHY FLOAT INSTEAD OF FLEX: In editorial layouts (Image 2), we want text to 
 * wrap around and UNDER the image if the text is longer than the image. 
 * Flex columns (Image 1) create empty vertical space under shorter images.
 *
 * IMAGE POSITION:
 *  - 'left'  → float-left with right margin
 *  - 'right' → float-right with left margin
 *
 * RESPONSIVE: On mobile (< 768px), we remove the float and stack them
 * vertically for readability.
 */

import Image from 'next/image';
import type { SplitBlockData } from '@/types';

interface Props {
  data: SplitBlockData;
}

export function SplitBlock({ data }: Props) {
  const { html, src, alt, title, caption, image_position, width, height } = data;


  return (
    <div className={`block clearfix overflow-visible ${image_position === 'left' ? 'editorial-wrap' : 'editorial-wrap-right'}`}>
      <figure className="mb-8">
        <div className="relative overflow-hidden rounded-lg shadow-soft ring-1 ring-stone-200/50">
          <Image
            src={src}
            alt={alt}
            title={title}
            width={width}
            height={height}
            sizes="(max-width: 768px) 100vw, 450px"
            className="w-full h-auto object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        </div>
        {caption && (
          <figcaption className="mt-3 text-center text-sm italic text-(--color-muted)">
            {caption}
          </figcaption>
        )}
      </figure>

      <div
        className="article-prose"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Clearfix to prevent subsequent blocks from floating up into this one */}
      <div className="clear-both" />
    </div>
  );
}
