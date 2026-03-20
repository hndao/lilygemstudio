/**
 * Error Boundary — catches unhandled errors in nested route segments.
 *
 * WHY error.tsx at root: This boundary wraps ALL route segments beneath the
 * root layout. It catches rendering errors, data fetching throws, and any
 * uncaught exceptions from page or layout components — EXCEPT the root
 * layout itself (that's global-error.tsx's job).
 *
 * WHY CLIENT COMPONENT: Error boundaries use React's componentDidCatch
 * mechanism which is client-only. The `reset()` callback re-renders the
 * segment tree, giving the user a chance to recover without a full reload.
 *
 * DESIGN: Matches the 404 page — warm, editorial, brand-consistent.
 * Includes Header/Footer because the root layout IS rendered.
 */
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, ShoppingBag } from 'lucide-react';

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to external error tracking (Sentry, etc.) when available
    console.error('[Error Boundary]', error);
  }, [error]);

  return (
    <>

      <main className="flex min-h-[calc(100vh-128px)] items-center justify-center bg-(--color-background) px-4 py-20">
        <motion.div
          className="text-center"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          {/* ── Decorative icon ─────────────────────────────────────────── */}
          <motion.div
            variants={fadeUp}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
            style={{
              background: 'linear-gradient(135deg, var(--color-sand), var(--color-sand-light))',
              boxShadow: '0 4px 24px rgba(45, 52, 54, 0.08)',
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-sage)"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </motion.div>

          {/* Sage accent line */}
          <motion.div
            variants={fadeUp}
            aria-hidden="true"
            className="mx-auto mb-6 h-0.5 w-12 rounded-full bg-(--color-sage)"
          />

          {/* Brand label */}
          <motion.p variants={fadeUp} className="brand-label mb-3">
            Something went wrong
          </motion.p>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="mb-4 text-(--color-stone)"
            style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)' }}
          >
            Oops! A Little Hiccup
          </motion.h1>

          {/* Body copy */}
          <motion.p
            variants={fadeUp}
            className="mx-auto mb-10 max-w-sm leading-relaxed text-(--color-muted)"
          >
            We hit an unexpected snag while loading this page.
            Our artisans are looking into it — please try again
            or explore something else.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            {/* Primary: Try Again */}
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 rounded-md bg-(--color-cta) px-6 py-3 font-heading text-sm font-semibold text-white transition-colors hover:bg-(--color-stone) cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try Again
            </button>

            {/* Secondary: Back to Home */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md border border-(--color-border) px-6 py-3 font-heading text-sm font-semibold text-(--color-stone) transition-colors hover:bg-(--color-sand)"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Home
            </Link>

            {/* Tertiary: Browse Shop */}
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-md border border-(--color-border) px-6 py-3 font-heading text-sm font-semibold text-(--color-stone) transition-colors hover:bg-(--color-sand)"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              Browse the Shop
            </Link>
          </motion.div>
        </motion.div>
      </main>

      <footer aria-hidden className="h-16 bg-(--color-stone)" />
    </>
  );
}
