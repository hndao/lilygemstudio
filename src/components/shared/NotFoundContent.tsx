'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Compass } from 'lucide-react';

// Typed as tuple — Framer Motion requires [n,n,n,n] for cubic bezier easing
const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export function NotFoundContent() {
  return (
    <main className="flex min-h-[calc(100vh-128px)] items-center justify-center bg-(--color-background) px-4 py-20">
      <motion.div
        className="text-center"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={fadeUp}
          aria-hidden="true"
          className="mb-2 select-none font-heading font-bold leading-none tracking-tighter"
          style={{
            fontSize: 'clamp(6rem, 18vw, 14rem)',
            WebkitTextStroke: '2px var(--color-stone)',
            color: 'transparent',
          }}
        >
          404
        </motion.div>

        <motion.div
          variants={fadeUp}
          aria-hidden="true"
          className="mx-auto mb-6 h-0.5 w-12 rounded-full bg-(--color-sage)"
        />

        <motion.p variants={fadeUp} className="brand-label mb-3">
          Page not found
        </motion.p>

        <motion.h1
          variants={fadeUp}
          className="mb-4 text-(--color-stone)"
          style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)' }}
        >
          Lost in the Workshop
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mx-auto mb-10 max-w-sm leading-relaxed text-(--color-muted)"
        >
          This page seems to have wandered off with one of our artisans.
          Don&apos;t worry — the good stuff is still here.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-(--color-cta) px-6 py-3 font-heading text-sm font-semibold text-white transition-colors hover:bg-(--color-stone)"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Home
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-md border border-(--color-border) px-6 py-3 font-heading text-sm font-semibold text-(--color-stone) transition-colors hover:bg-(--color-sand)"
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            Browse the Shop
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
