'use client';

/**
 * HeroContent — animated headline and CTA for the homepage hero.
 *
 * WHY THIS IS A SEPARATE CLIENT COMPONENT:
 *  Framer Motion's `motion.*` components require a client boundary. By isolating
 *  only the animated text here, the parent HeroSection stays a Server Component
 *  and can emit the fetchpriority=high preload hint for the hero image — which
 *  is the critical fix for LCP < 1.2s. See HeroSection.tsx for full context.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

// Cubic bezier ease — typed as tuple so Framer Motion accepts it
const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

function fadeUpVariant(delay = 0) {
  return { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE, delay } };
}

interface HeroContentProps {
  title: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  /** Optional secondary outline button — rendered only when both are non-empty */
  cta2Text?: string;
  cta2Url?: string;
}

export function HeroContent({ title, description, ctaText, ctaUrl, cta2Text, cta2Url }: HeroContentProps) {
  // Split title on \n so the admin can control the line break from the CMS
  const [titleLine1, titleLine2] = title.split('\n');
  const hasSecondary = !!(cta2Text && cta2Url);

  return (
    <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 pb-12 md:px-6 md:pb-16 lg:px-8 lg:pb-20">
      <motion.h1
        className="max-w-xl text-(--color-cream) [text-shadow:0_2px_12px_rgba(0,0,0,0.65)]"
        initial={{ opacity: 0, y: 20 }}
        animate={fadeUpVariant(0)}
      >
        {titleLine1}
        {titleLine2 && (
          <>
            <br />
            <span className="editorial-title text-(--color-sand)">{titleLine2}</span>
          </>
        )}
      </motion.h1>

      <motion.p
        className="mt-3 max-w-md text-base text-(--color-sand)/80 md:text-lg [text-shadow:0_1px_8px_rgba(0,0,0,0.55)]"
        initial={{ opacity: 0, y: 20 }}
        animate={fadeUpVariant(0.15)}
      >
        {description}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={fadeUpVariant(0.3)}
        className="mt-6 flex flex-wrap items-center gap-3"
      >
        {/* Primary button */}
        <Link
          href={ctaUrl}
          className="inline-flex items-center gap-2 rounded-md bg-(--color-cta) px-6 py-3 font-heading text-sm font-600 text-white transition-colors hover:bg-(--color-cta-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-sage-dark)"
        >
          {ctaText}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>

        {/* Secondary outline button — only rendered when configured in CMS */}
        {hasSecondary && (
          <Link
            href={cta2Url!}
            className="inline-flex items-center gap-2 rounded-md border border-(--color-cream)/60 px-6 py-3 font-heading text-sm font-600 text-(--color-cream) transition-colors hover:border-(--color-cream) hover:bg-(--color-cream)/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-cream)"
          >
            {cta2Text}
          </Link>
        )}
      </motion.div>
    </div>
  );
}

