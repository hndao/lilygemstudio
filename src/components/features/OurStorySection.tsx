'use client';

/**
 * OurStorySection — brand editorial section on the homepage.
 * Content is driven by Settings → Pages Content → Home Page (bilingual EN/VI).
 * Falls back to hardcoded English when settings are not populated.
 */

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { PageHomeContent } from '@/types';

// Typed as tuple — Framer Motion's Easing type requires [number,number,number,number]
const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

interface Props {
  content?: PageHomeContent;
  lang?: string;
}

function txt(c: PageHomeContent | undefined, key: string, lang: string, fallback: string): string {
  if (!c) return fallback;
  const val = (c as Record<string, unknown>)[`${key}_${lang}`] ?? (c as Record<string, unknown>)[`${key}_en`];
  return typeof val === 'string' && val.trim() ? val : fallback;
}

export function OurStorySection({ content, lang = 'en' }: Props) {
  const imageUrl  = content?.hero_image_url || '/images/agate-slice.avif';
  const imageAlt  = content?.hero_image_alt || 'Close-up of a natural agate gemstone slice revealing intricate banding patterns';

  const label    = txt(content, 'story_label',   lang, 'Our Story');
  const heading  = txt(content, 'story_heading', lang, 'Where Nature Meets Art: The Heart Behind LilyGem');
  const body1    = txt(content, 'story_body1',   lang, "LilyGemStudio was founded in Ho Chi Minh City in 2023 with a profound appreciation for the earth's raw beauty. We believe that true quality is found where <strong>nature meets art</strong>.");
  const body2    = txt(content, 'story_body2',   lang, 'Inspired by the timeless elegance and unique patterns of natural agate, our mission is to hand-curate <strong>authentic gemstone treasures</strong> that connect you back to the earth. Every piece tells a unique story of nature\'s creativity.');
  const body3    = txt(content, 'story_body3',   lang, "Every bracelet and ring featured at LilyGemStudio is meticulously handcrafted. No two pieces are alike—just like the people who wear them. Celebrate life's special moments and express your individuality through our curated collections.");
  const ctaText  = txt(content, 'story_cta',     lang, 'Learn More');

  return (
    <section
      className="bg-(--color-cream) py-16 md:py-24"
      aria-labelledby="our-story-heading"
    >
      <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center md:gap-16">

          {/* Text column */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <span className="brand-label">{label}</span>
            <h2
              id="our-story-heading"
              className="editorial-title mt-3 text-(--color-stone)"
              style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)' }}
            >
              {heading}
            </h2>
            <p
              className="mt-4 leading-relaxed text-(--color-muted)"
              dangerouslySetInnerHTML={{ __html: body1 }}
            />
            <p
              className="mt-3 leading-relaxed text-(--color-muted)"
              dangerouslySetInnerHTML={{ __html: body2 }}
            />
            <p
              className="mt-3 leading-relaxed text-(--color-muted)"
              dangerouslySetInnerHTML={{ __html: body3 }}
            />
            <Link
              href={`/${lang}/our-story`}
              className="mt-6 inline-flex items-center gap-2 font-heading text-sm font-600 text-(--color-sage) transition-colors hover:text-(--color-sage-dark)"
            >
              {ctaText}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </motion.div>

          {/* Editorial image — hidden on mobile */}
          <motion.div
            className="hidden md:block"
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
              <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                sizes="(max-width: 1279px) 50vw, 640px"
                className="object-cover"
                unoptimized
              />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
