/**
 * About — /about
 *
 * WHY STATIC: Brand/mission content changes only on intentional rewrites.
 * force-static ensures Vercel caches this at the CDN edge indefinitely.
 */

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'About | DARIIV',
  description:
    'DARIIV is a curated marketplace for artisan goods — handpicked products with verified reviews and transparent affiliate disclosures.',
  alternates: { canonical: 'https://dariiv.com/about' },
  openGraph: {
    title: 'About | DARIIV',
    description:
      'DARIIV is a curated marketplace for artisan goods — handpicked products with verified reviews and transparent affiliate disclosures.',
    type: 'website',
  },
};

const STATS = [
  { value: '500+', label: 'Curated Products' },
  { value: '120+', label: 'Artisan Partners' },
  { value: '98%', label: 'Verified Reviews' },
  { value: '2', label: 'Markets: US & CA' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'We Find the Makers',
    body: 'Our team travels to source regions and scours independent markets to find artisans whose craft meets our quality bar.',
  },
  {
    step: '02',
    title: 'We Verify the Reviews',
    body: 'Every review on DARIIV is from a confirmed buyer. We cross-reference purchase records before a review goes live.',
  },
  {
    step: '03',
    title: 'We Link Transparently',
    body: 'When you click through and buy, we earn a small commission. This is always disclosed — it\'s how we fund the curation.',
  },
  {
    step: '04',
    title: 'You Shop with Confidence',
    body: 'You get honest recommendations, real stories, and fair prices — with no hidden agendas.',
  },
];

const VALUES = [
  {
    title: 'Craft Over Commerce',
    body: 'We lead with the maker\'s story, not the margin. Products are chosen for quality and provenance first.',
  },
  {
    title: 'Transparency Always',
    body: 'Affiliate relationships, pricing sources, and review methodology are all disclosed openly.',
  },
  {
    title: 'Community Driven',
    body: 'Our editorial direction is shaped by the DARIIV community — the products you love most rise to the top.',
  },
];

export default function AboutPage() {
  return (
    <main>
      {/* ── Page header ── */}
      <section className="bg-(--color-sand-light) py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center md:gap-16">
            <div>
              <span className="brand-label">About DARIIV</span>
              <h1 className="mt-3">
                A Marketplace Built on{' '}
                <span className="editorial-title text-(--color-sage)">Trust</span>
              </h1>
              <p className="mt-5 max-w-lg leading-relaxed text-(--color-muted)">
                DARIIV is a curated discovery platform for artisan goods. We handpick every product,
                verify every review, and disclose every affiliate relationship — so you can shop
                with complete confidence.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/shop"
                  className="inline-flex items-center rounded-full bg-(--color-sage) px-6 py-3 font-heading text-sm font-600 text-white transition-colors hover:bg-(--color-sage-dark)"
                >
                  Shop the Collection
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-full border border-(--color-stone) px-6 py-3 font-heading text-sm font-600 text-(--color-stone) transition-colors hover:bg-(--color-stone) hover:text-white"
                >
                  Get in Touch
                </Link>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
              <Image
                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80"
                alt="Artisan handwoven baskets and ceramics arranged on a warm wooden surface"
                fill
                priority
                sizes="(max-width: 767px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-(--color-stone) py-12 md:py-16">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8">
          <dl className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <dt className="font-heading text-4xl font-700 text-(--color-sand)">{s.value}</dt>
                <dd className="mt-1 text-sm text-(--color-sand)/70">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-(--color-background) py-16 md:py-24" aria-labelledby="how-heading">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8">
          <div className="text-center">
            <span className="brand-label">The Process</span>
            <h2 id="how-heading" className="mt-3">How DARIIV Works</h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="flex flex-col">
                <span className="font-heading text-4xl font-700 text-(--color-sage)/30">{item.step}</span>
                <h3 className="mt-3 font-heading text-base font-600 text-(--color-stone)">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="bg-(--color-cream) py-16 md:py-24" aria-labelledby="values-heading">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8">
          <div className="text-center">
            <span className="brand-label">What Drives Us</span>
            <h2 id="values-heading" className="mt-3">Our Values</h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-xl border border-(--color-border) bg-(--color-background) p-8">
                <h3 className="font-heading text-lg font-600 text-(--color-stone)">{v.title}</h3>
                <p className="mt-3 leading-relaxed text-(--color-muted)">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA strip ── */}
      <section className="bg-(--color-sage) py-16 md:py-20">
        <div className="mx-auto max-w-[760px] px-4 text-center md:px-6 lg:px-8">
          <h2 className="text-white">Ready to Discover Something Special?</h2>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-white/80">
            Browse our hand-curated collection of artisan goods — each one with a story worth knowing.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/shop"
              className="inline-flex items-center rounded-full bg-white px-8 py-3 font-heading text-sm font-600 text-(--color-sage) transition-colors hover:bg-(--color-cream)"
            >
              Shop Now
            </Link>
            <Link
              href="/our-story"
              className="inline-flex items-center rounded-full border border-white/60 px-8 py-3 font-heading text-sm font-600 text-white transition-colors hover:border-white hover:bg-white/10"
            >
              Our Story
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
