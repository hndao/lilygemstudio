/**
 * Our Story — /our-story
 *
 * WHY STATIC: Brand editorial content changes only on intentional rewrites.
 * force-static ensures Vercel caches this at the CDN edge indefinitely.
 */

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Home, Gem } from 'lucide-react';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Our Story | DARIIV',
  description:
    'How DARIIV was born — a belief that the best products come from artisans who pour intention into every piece.',
  alternates: { canonical: 'https://dariiv.com/our-story' },
  openGraph: {
    title: 'Our Story | DARIIV',
    description:
      'How DARIIV was born — a belief that the best products come from artisans who pour intention into every piece.',
    type: 'website',
  },
};

export default function OurStoryPage() {
  return (
    <main className="bg-[#FDF8F2]">

      {/* ══════════════════════════════════════════════════════════════════
          Section 1 — Hero Story (Split Layout)
          Desktop: image left | text right
          Mobile:  image top  | text below
          ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24" aria-labelledby="our-story-heading">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center md:gap-16">

            {/* Craftsman image — LCP candidate: priority + eager */}
            <div
              className="relative aspect-[4/5] overflow-hidden rounded-xl"
              style={{ boxShadow: 'var(--shadow-lifted)' }}
            >
              <Image
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80"
                alt="DARIIV craftsman curating premium products for smart home and agate jewelry"
                fill
                priority
                sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 640px"
                className="object-cover"
              />
            </div>

            {/* Story text */}
            <div>
              <span className="brand-label">OUR MISSION</span>
              <h1
                id="our-story-heading"
                className="mt-3 font-serif text-[#2D2D2D]"
                style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.15, fontWeight: 700 }}
              >
                Craft, Curated with Care.
              </h1>
              <p className="mt-6 leading-relaxed text-(--color-muted)">
                DARIIV was born from a belief that the best products come from artisans who pour
                intention into every piece. We travel the world to find makers whose craft tells a
                story — then bring those stories to your home, with honest reviews and transparent
                choices.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          Section 2 — The Two Pillars (The DARIIV Difference)
          Two cards side-by-side; stack vertically on mobile
          ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24" aria-labelledby="pillars-heading">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8">

          <div className="mb-12 text-center">
            <span className="brand-label">THE DARIIV DIFFERENCE</span>
            <h2
              id="pillars-heading"
              className="mt-3 font-serif text-[#2D2D2D]"
              style={{ lineHeight: 1.2 }}
            >
              Two Niches. One Standard.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            {/* Card A — Smart Home for Seniors */}
            <div
              className="flex flex-col rounded-xl border border-(--color-border) bg-white p-8"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-(--color-sage)/10">
                <Home className="h-6 w-6 text-(--color-sage-dark)" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-[#2D2D2D]">
                Innovation for Longevity
              </h3>
              <p className="mt-3 leading-relaxed text-(--color-muted)">
                Technology should empower, not confuse. We specialize in curating smart home
                solutions that ensure safety, independence, and peace of mind for the elderly
                and their loved ones.
              </p>
            </div>

            {/* Card B — Agate & Nature */}
            <div
              className="flex flex-col rounded-xl border border-(--color-border) bg-white p-8"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-(--color-sage)/10">
                <Gem className="h-6 w-6 text-(--color-sage-dark)" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-[#2D2D2D]">
                Nature&apos;s Timeless Elegance
              </h3>
              <p className="mt-3 leading-relaxed text-(--color-muted)">
                Beyond gadgets, we find solace in the earth. Our hand-selected Agate collection
                represents a return to nature — bringing balance, protection, and organic beauty
                to your personal sanctuary.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          Section 3 — Our Promise & Transparency (Trust / E-E-A-T)
          Slightly darker cream bg distinguishes this from adjacent sections
          ══════════════════════════════════════════════════════════════════ */}
      <section
        className="bg-(--color-sand-light) py-16 md:py-24"
        aria-labelledby="promise-heading"
      >
        <div className="mx-auto max-w-[760px] px-4 text-center md:px-6 lg:px-8">
          <span className="brand-label">OUR PROMISE</span>
          <h2
            id="promise-heading"
            className="mt-3 font-serif text-[#2D2D2D]"
            style={{ lineHeight: 1.2 }}
          >
            Integrity Over Everything.
          </h2>
          <p className="mt-6 leading-relaxed text-(--color-muted)">
            As an independent review site, our loyalty lies with you. Every product featured on
            DARIIV is verified by real-world use. When you buy through our links, we may earn a
            small commission from Amazon, which helps us keep testing and telling these stories.
            No middlemen, no mystery — just quality you can trust.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          Section 4 — Call to Action (Conversion Path)
          ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 text-center md:px-6 lg:px-8">
          <h2
            className="font-serif text-[#2D2D2D]"
            style={{ lineHeight: 1.2 }}
          >
            Ready to enhance your home?
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {/* Primary CTA */}
            <Link
              href="/shop"
              className="inline-flex items-center rounded-md bg-(--color-cta) px-8 py-3.5 font-heading text-sm font-semibold text-white transition-colors hover:bg-(--color-stone) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-cta)"
            >
              Explore Smart Home
            </Link>
            {/* Secondary CTA — outline */}
            <Link
              href="/shop"
              className="inline-flex items-center rounded-md border border-[#2D2D2D] px-8 py-3.5 font-heading text-sm font-semibold text-[#2D2D2D] transition-colors hover:bg-[#2D2D2D] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D2D2D]"
            >
              Shop Agate Collection
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
