/**
 * Our Story — /[lang]/our-story
 *
 * ISR page — revalidates every 24h matching the settings cache TTL.
 * Content is managed from the Filament admin panel (Settings → Pages Content).
 * Falls back to hardcoded English text when settings are not yet populated.
 */

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Home, Gem } from 'lucide-react';
import { getSiteSettings } from '@/lib/api';
import type { PageStoryContent } from '@/types';
import type { Locale } from '@/middleware';

export const revalidate = 86400;

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'vi' }];
}

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

// ── Text resolver ─────────────────────────────────────────────────────────────

function txt(c: PageStoryContent | undefined, key: string, lang: string, fallback: string): string {
  if (!c) return fallback;
  const val = (c as Record<string, unknown>)[`${key}_${lang}`] ?? (c as Record<string, unknown>)[`${key}_en`];
  return typeof val === 'string' && val.trim() ? val : fallback;
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface Props { params: Promise<{ lang: Locale }> }

export default async function OurStoryPage({ params }: Props) {
  const { lang } = await params;
  const settings = await getSiteSettings().catch(() => null);
  const c = settings?.pages?.page_story;

  return (
    <main className="bg-[#FDF8F2]">

      {/* ══════════════════════════════════════════════════════════════════
          Section 1 — Hero Story (Split Layout)
          ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24" aria-labelledby="our-story-heading">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center md:gap-16">

            <div
              className="relative aspect-[4/5] overflow-hidden rounded-xl"
              style={{ boxShadow: 'var(--shadow-lifted)' }}
            >
              <Image
                src={c?.hero_image_url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80'}
                alt={c?.hero_image_alt || 'LilyGem Studio artisan handcrafting natural agate jewelry in Ho Chi Minh City, Vietnam'}
                fill
                priority
                sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 640px"
                className="object-cover"
              />
            </div>

            <div>
              <span className="brand-label">{txt(c, 'hero_label', lang, 'OUR STORY')}</span>
              <h1
                id="our-story-heading"
                className="mt-3 font-serif text-[#2D2D2D]"
                style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.15, fontWeight: 700 }}
              >
                {txt(c, 'hero_title', lang, 'Born from Stone, Made by Hand.')}
              </h1>
              <p className="mt-6 leading-relaxed text-(--color-muted)">
                {txt(c, 'hero_body', lang, "LilyGem Studio was founded in Ho Chi Minh City in 2023, inspired by the timeless elegance and unique patterns of natural agate. We believe jewelry is more than decoration — it is a way to connect with nature, express individuality, and celebrate life's most meaningful moments. Every piece we craft tells the story of the earth that formed it.")}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          Section 2 — The Two Pillars
          ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24" aria-labelledby="pillars-heading">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8">

          <div className="mb-12 text-center">
            <span className="brand-label">{txt(c, 'pillars_label', lang, 'WHAT SETS US APART')}</span>
            <h2
              id="pillars-heading"
              className="mt-3 font-serif text-[#2D2D2D]"
              style={{ lineHeight: 1.2 }}
            >
              {txt(c, 'pillars_heading', lang, 'Two Pillars. One Purpose.')}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            <div
              className="flex flex-col rounded-xl border border-(--color-border) bg-white p-8"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-(--color-sage)/10">
                <Home className="h-6 w-6 text-(--color-sage-dark)" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-[#2D2D2D]">
                {txt(c, 'pillar_a_title', lang, 'Ethically Sourced Stone')}
              </h3>
              <p className="mt-3 leading-relaxed text-(--color-muted)">
                {txt(c, 'pillar_a_body', lang, 'We partner with two trusted natural stone companies in Vietnam — including a natural company in Ho Chi Minh City and a Natural Stone Partner operating across the country — to ensure every piece of raw agate is ethically and sustainably mined.')}
              </p>
            </div>

            <div
              className="flex flex-col rounded-xl border border-(--color-border) bg-white p-8"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-(--color-sage)/10">
                <Gem className="h-6 w-6 text-(--color-sage-dark)" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-[#2D2D2D]">
                {txt(c, 'pillar_b_title', lang, 'Handcrafted, Never Duplicated')}
              </h3>
              <p className="mt-3 leading-relaxed text-(--color-muted)">
                {txt(c, 'pillar_b_body', lang, 'Every bangle and bracelet is shaped and polished by hand in our studio. Because agate is formed by nature, no two stones share the same pattern — which means every LilyGem piece you wear is truly one of a kind.')}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          Section 3 — Philosophy
          ══════════════════════════════════════════════════════════════════ */}
      <section
        className="bg-(--color-sand-light) py-16 md:py-24"
        aria-labelledby="promise-heading"
      >
        <div className="mx-auto max-w-[760px] px-4 text-center md:px-6 lg:px-8">
          <span className="brand-label">{txt(c, 'philosophy_label', lang, 'OUR PHILOSOPHY')}</span>
          <h2
            id="promise-heading"
            className="mt-3 font-serif text-[#2D2D2D]"
            style={{ lineHeight: 1.2 }}
          >
            {txt(c, 'philosophy_heading', lang, "Nature's Creativity, Honored.")}
          </h2>
          <p className="mt-6 leading-relaxed text-(--color-muted)">
            {txt(c, 'philosophy_body', lang, "We are inspired by the belief that every piece of agate carries nature's own artistry — patterns formed over millions of years, unique to that single stone. Our role is simply to honor that beauty: to shape it carefully, finish it with intention, and place it in the hands of someone who will treasure it. No mass production, no shortcuts — just craft, stone, and story.")}
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          Section 4 — CTA
          ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 text-center md:px-6 lg:px-8">
          <h2
            className="font-serif text-[#2D2D2D]"
            style={{ lineHeight: 1.2 }}
          >
            {txt(c, 'cta_heading', lang, 'Find your piece of nature.')}
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/${lang}/shop`}
              className="inline-flex items-center rounded-md bg-(--color-cta) px-8 py-3.5 font-heading text-sm font-semibold text-white transition-colors hover:bg-(--color-stone) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-cta)"
            >
              {txt(c, 'cta_shop', lang, 'Shop the Collection')}
            </Link>
            <Link
              href={`/${lang}/about`}
              className="inline-flex items-center rounded-md border border-[#2D2D2D] px-8 py-3.5 font-heading text-sm font-semibold text-[#2D2D2D] transition-colors hover:bg-[#2D2D2D] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D2D2D]"
            >
              {txt(c, 'cta_about', lang, 'About LilyGem Studio')}
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
