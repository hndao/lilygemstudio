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
  title: 'Our Story | LilyGem Studio',
  description:
    'How LilyGem Studio began — a passion for natural agate, born in Ho Chi Minh City in 2023, where every stone becomes a wearable piece of nature.',
  alternates: { canonical: 'https://lilygemstudio.com/our-story' },
  openGraph: {
    title: 'Our Story | LilyGem Studio',
    description:
      'How LilyGem Studio began — a passion for natural agate, born in Ho Chi Minh City in 2023, where every stone becomes a wearable piece of nature.',
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
                alt="LilyGem Studio artisan handcrafting natural agate jewelry in Ho Chi Minh City, Vietnam"
                fill
                priority
                sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 640px"
                className="object-cover"
              />
            </div>

            {/* Story text */}
            <div>
              <span className="brand-label">OUR STORY</span>
              <h1
                id="our-story-heading"
                className="mt-3 font-serif text-[#2D2D2D]"
                style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.15, fontWeight: 700 }}
              >
                Born from Stone, Made by Hand.
              </h1>
              <p className="mt-6 leading-relaxed text-(--color-muted)">
                LilyGem Studio was founded in Ho Chi Minh City in 2023, inspired by the timeless
                elegance and unique patterns of natural agate. We believe jewelry is more than
                decoration — it is a way to connect with nature, express individuality, and
                celebrate life&apos;s most meaningful moments. Every piece we craft tells the story
                of the earth that formed it.
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
            <span className="brand-label">WHAT SETS US APART</span>
            <h2
              id="pillars-heading"
              className="mt-3 font-serif text-[#2D2D2D]"
              style={{ lineHeight: 1.2 }}
            >
              Two Pillars. One Purpose.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            {/* Card A — Ethical Sourcing */}
            <div
              className="flex flex-col rounded-xl border border-(--color-border) bg-white p-8"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-(--color-sage)/10">
                <Home className="h-6 w-6 text-(--color-sage-dark)" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-[#2D2D2D]">
                Ethically Sourced Stone
              </h3>
              <p className="mt-3 leading-relaxed text-(--color-muted)">
                We partner with two trusted natural stone companies in Vietnam — including a natural
                company in Ho Chi Minh City and a Natural Stone Partner operating across the country
                — to ensure every piece of raw agate is ethically and sustainably mined.
              </p>
            </div>

            {/* Card B — Handcrafted Artistry */}
            <div
              className="flex flex-col rounded-xl border border-(--color-border) bg-white p-8"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-(--color-sage)/10">
                <Gem className="h-6 w-6 text-(--color-sage-dark)" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-[#2D2D2D]">
                Handcrafted, Never Duplicated
              </h3>
              <p className="mt-3 leading-relaxed text-(--color-muted)">
                Every bangle and bracelet is shaped and polished by hand in our studio. Because
                agate is formed by nature, no two stones share the same pattern — which means
                every LilyGem piece you wear is truly one of a kind.
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
          <span className="brand-label">OUR PHILOSOPHY</span>
          <h2
            id="promise-heading"
            className="mt-3 font-serif text-[#2D2D2D]"
            style={{ lineHeight: 1.2 }}
          >
            Nature&apos;s Creativity, Honored.
          </h2>
          <p className="mt-6 leading-relaxed text-(--color-muted)">
            We are inspired by the belief that every piece of agate carries nature&apos;s own
            artistry — patterns formed over millions of years, unique to that single stone.
            Our role is simply to honor that beauty: to shape it carefully, finish it with
            intention, and place it in the hands of someone who will treasure it. No mass
            production, no shortcuts — just craft, stone, and story.
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
            Find your piece of nature.
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {/* Primary CTA */}
            <Link
              href="/shop"
              className="inline-flex items-center rounded-md bg-(--color-cta) px-8 py-3.5 font-heading text-sm font-semibold text-white transition-colors hover:bg-(--color-stone) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-cta)"
            >
              Shop the Collection
            </Link>
            {/* Secondary CTA — outline */}
            <Link
              href="/about"
              className="inline-flex items-center rounded-md border border-[#2D2D2D] px-8 py-3.5 font-heading text-sm font-semibold text-[#2D2D2D] transition-colors hover:bg-[#2D2D2D] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D2D2D]"
            >
              About LilyGem Studio
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
