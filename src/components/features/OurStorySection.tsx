'use client';

/**
 * OurStorySection — brand editorial section on the homepage.
 *
 * BREAKPOINT BEHAVIOUR (from wireframes):
 *  - Mobile:  stacked — text above, no image
 *  - Tablet:  2-col side-by-side — text left, editorial image right
 *  - Desktop: same 2-col, wider max-width
 *
 * WHY editorial-title: Playfair Display italic signals a shift in register —
 * from commerce to craft story. This is the emotional anchor of the homepage.
 */

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

// Typed as tuple — Framer Motion's Easing type requires [number,number,number,number] for cubic bezier
const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export function OurStorySection() {
  return (
    <section
      className="bg-(--color-cream) py-16 md:py-24"
      aria-labelledby="our-story-heading"
    >
      <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8">
        {/* 2-col on tablet+, stacked on mobile */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center md:gap-16">

          {/* Text column */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <span className="brand-label">Our Story</span>
            <h2
              id="our-story-heading"
              className="editorial-title mt-3 text-(--color-stone)"
              style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)' }}
            >
              Where Nature Meets Art: The Heart Behind LilyGem
            </h2>
            <p className="mt-4 leading-relaxed text-(--color-muted)">
              LilyGemStudio was founded in Ho Chi Minh City in 2023 with a profound appreciation for the earth&apos;s raw beauty. We believe that true quality is found where <strong>nature meets art</strong>.
            </p>
            <p className="mt-3 leading-relaxed text-(--color-muted)">
              Inspired by the timeless elegance and unique patterns of natural agate, our mission is to hand-curate <strong>authentic gemstone treasures</strong> that connect you back to the earth. Every piece tells a unique story of nature&apos;s creativity.
            </p>
            <p className="mt-3 leading-relaxed text-(--color-muted)">
              Every bracelet and ring featured at LilyGemStudio is meticulously handcrafted. No two pieces are alike—just like the people who wear them. Celebrate life&apos;s special moments and express your individuality through our curated collections.
            </p>
            <Link
              href="/our-story"
              className="mt-6 inline-flex items-center gap-2 font-heading text-sm font-600 text-(--color-sage) transition-colors hover:text-(--color-sage-dark)"
            >
              Learn More
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </motion.div>

          {/* Editorial image — hidden on mobile, visible on tablet+ */}
          <motion.div
            className="hidden md:block"
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
              <Image
                src="/images/agate-slice.avif"
                alt="Close-up of a natural agate gemstone slice revealing intricate banding patterns"
                fill
                sizes="(max-width: 1279px) 50vw, 640px"
                className="object-cover"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

