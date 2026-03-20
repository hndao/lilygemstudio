/**
 * ImageBlock — renders a single image with SEO metadata as a <figure>.
 *
 * WHY <figure>/<figcaption>: Semantic HTML. Google uses <figure> context to
 * understand images. <figcaption> is indexed and can appear in image carousel
 * snippets in Search.
 *
 * ALIGNMENT:
 *  - full    → 100% container width (default)
 *  - center  → 80% width, centred via mx-auto
 *  - left    → floated left, text wraps right (float-left)
 *  - right   → floated right, text wraps left (float-right)
 *
 * WHY next/image: Automatic WebP conversion, responsive srcset, and
 * lazy loading with CLS prevention. Alt and title are passed directly
 * from the API — no transformation at the component layer.
 *
 * NO INLINE STYLES: All layout control is via Tailwind classes.
 */

import Image from 'next/image';
import type { ImageBlockData } from '@/types';

interface Props {
  data: ImageBlockData;
}

const alignmentClasses: Record<ImageBlockData['alignment'], string> = {
  full:   'w-full',
  center: 'mx-auto w-4/5',
  left:   'float-left mr-6 mb-4 w-1/2 max-w-xs md:max-w-sm',
  right:  'float-right ml-6 mb-4 w-1/2 max-w-xs md:max-w-sm',
};

export function ImageBlock({ data }: Props) {
  const { src, alt, title, caption, alignment, width, height } = data;
  const wrapperClass = alignmentClasses[alignment] ?? alignmentClasses.full;

  return (
    <figure className={wrapperClass}>
      <div className="relative overflow-hidden rounded-lg">
        <Image
          src={src}
          alt={alt}
          title={title}
          width={width}
          height={height}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 960px"
          className="w-full object-cover"
          loading="lazy"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm italic text-(--color-muted)">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

