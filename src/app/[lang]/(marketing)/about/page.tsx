/**
 * About — /[lang]/about
 *
 * ISR page — revalidates every 24h matching the settings cache TTL.
 * Content is managed from the Filament admin panel (Settings → Pages Content).
 * Falls back to hardcoded English text when settings are not yet populated.
 */

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getSiteSettings } from '@/lib/api';
import type { PageAboutContent } from '@/types';
import type { Locale } from '@/middleware';

export const revalidate = 86400;

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'vi' }];
}

export const metadata: Metadata = {
  title: 'About | LilyGem Studio',
  description:
    "LilyGem Studio crafts handmade natural agate jewelry in Ho Chi Minh City, Vietnam — unique bangles and bracelets inspired by nature's timeless elegance.",
  alternates: { canonical: 'https://lilygemstudio.com/about' },
  openGraph: {
    title: 'About | LilyGem Studio',
    description:
      "LilyGem Studio crafts handmade natural agate jewelry in Ho Chi Minh City, Vietnam — unique bangles and bracelets inspired by nature's timeless elegance.",
    type: 'website',
  },
};

// ── Hardcoded fallbacks (English) ─────────────────────────────────────────────

const FB_STATS = [
  { value: '100%',     label: 'Natural Stone, No Dye' },
  { value: 'Est. 2023', label: 'Ho Chi Minh City, Vietnam' },
  { value: '2',        label: 'Ethical Mining Partners' },
  { value: '0',        label: 'Two Pieces Alike' },
];

const FB_STEPS = [
  { step: '01', title: 'We Source Ethically',     body: 'Raw agate is selected from two trusted Vietnamese partners committed to responsible, sustainable mining in Ho Chi Minh City and across Vietnam.' },
  { step: '02', title: 'We Handcraft Each Piece',  body: 'Every bangle and bracelet is shaped and polished by hand in our studio. Meticulous craftsmanship ensures no two pieces are ever identical.' },
  { step: '03', title: "We Tell the Stone's Story", body: "Each piece ships with its provenance — the stone's origin, the natural patterns that make it unique, and the intention behind its design." },
  { step: '04', title: 'You Wear Nature',           body: "Your jewelry becomes a personal connection with nature's artistry — timeless, organic, and entirely one of a kind." },
];

const FB_VALUES = [
  { title: 'Nature Over Mass Production', body: 'Every piece begins with raw agate chosen for its unique pattern. We never use synthetic materials or duplicated molds — nature sets the design.' },
  { title: 'Meticulous Craftsmanship',    body: 'Hand-formed and polished in our Ho Chi Minh City studio, each piece honors the material and the centuries-old tradition of stone artistry.' },
  { title: 'Ethical Roots',              body: 'Our raw agate is sourced from two trusted Vietnamese partners dedicated to responsible, sustainably mined stone — from the earth, with care.' },
];

// ── Text resolver ─────────────────────────────────────────────────────────────

function txt(c: PageAboutContent | undefined, key: string, lang: string, fallback: string): string {
  if (!c) return fallback;
  const val = (c as Record<string, unknown>)[`${key}_${lang}`] ?? (c as Record<string, unknown>)[`${key}_en`];
  return typeof val === 'string' && val.trim() ? val : fallback;
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface Props { params: Promise<{ lang: Locale }> }

export default async function AboutPage({ params }: Props) {
  const { lang } = await params;
  const settings = await getSiteSettings().catch(() => null);
  const c = settings?.pages?.page_about;

  // ── Resolve arrays with per-language labels ───────────────────────────────
  const stats = c?.stats?.length
    ? c.stats.map((s) => ({ value: s.value, label: lang === 'vi' ? s.label_vi : s.label_en }))
    : FB_STATS;

  const steps = c?.process_steps?.length
    ? c.process_steps.map((s) => ({
        step:  s.step,
        title: lang === 'vi' ? s.title_vi : s.title_en,
        body:  lang === 'vi' ? s.body_vi  : s.body_en,
      }))
    : FB_STEPS;

  const values = c?.values_items?.length
    ? c.values_items.map((v) => ({
        title: lang === 'vi' ? v.title_vi : v.title_en,
        body:  lang === 'vi' ? v.body_vi  : v.body_en,
      }))
    : FB_VALUES;

  return (
    <main>
      {/* ── Page header ── */}
      <section className="bg-(--color-sand-light) py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center md:gap-16">
            <div>
              <span className="brand-label">
                {txt(c, 'hero_label', lang, 'About LilyGem Studio')}
              </span>
              <h1 className="mt-3">
                {txt(c, 'hero_title', lang, 'Where Nature Meets')}{' '}
                <span className="editorial-title text-(--color-sage)">Art</span>
              </h1>
              <p className="mt-5 max-w-lg leading-relaxed text-(--color-muted)">
                {txt(c, 'hero_body', lang, 'LilyGem Studio creates unique natural agate jewelry from the heart of Vietnam. Inspired by the timeless elegance of stone and the rhythms of nature, every piece is handcrafted in Ho Chi Minh City — and no two are ever the same.')}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href={`/${lang}/shop`}
                  className="inline-flex items-center rounded-full bg-(--color-sage) px-6 py-3 font-heading text-sm font-600 text-white transition-colors hover:bg-(--color-sage-dark)"
                >
                  {txt(c, 'hero_cta_shop', lang, 'Shop the Collection')}
                </Link>
                <Link
                  href={`/${lang}/contact`}
                  className="inline-flex items-center rounded-full border border-(--color-stone) px-6 py-3 font-heading text-sm font-600 text-(--color-stone) transition-colors hover:bg-(--color-stone) hover:text-white"
                >
                  {txt(c, 'hero_cta_contact', lang, 'Get in Touch')}
                </Link>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
              <Image
                src={c?.hero_image_url || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80'}
                alt={c?.hero_image_alt || 'Natural agate stone jewelry handcrafted in Ho Chi Minh City, Vietnam by LilyGem Studio'}
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
            {stats.map((s) => (
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
            <span className="brand-label">{txt(c, 'process_label', lang, 'The Process')}</span>
            <h2 id="how-heading" className="mt-3">{txt(c, 'process_heading', lang, 'How We Make It')}</h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((item) => (
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
            <span className="brand-label">{txt(c, 'values_label', lang, 'What Drives Us')}</span>
            <h2 id="values-heading" className="mt-3">{txt(c, 'values_heading', lang, 'Our Values')}</h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {values.map((v) => (
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
          <h2 className="text-white">{txt(c, 'cta_heading', lang, 'Ready to Wear a Piece of Nature?')}</h2>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-white/80">
            {txt(c, 'cta_body', lang, 'Browse our collection of handcrafted natural agate jewelry — each piece unique, each one a story worth wearing.')}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href={`/${lang}/shop`}
              className="inline-flex items-center rounded-full bg-white px-8 py-3 font-heading text-sm font-600 text-(--color-sage) transition-colors hover:bg-(--color-cream)"
            >
              {txt(c, 'cta_shop', lang, 'Shop Now')}
            </Link>
            <Link
              href={`/${lang}/our-story`}
              className="inline-flex items-center rounded-full border border-white/60 px-8 py-3 font-heading text-sm font-600 text-white transition-colors hover:border-white hover:bg-white/10"
            >
              {txt(c, 'cta_story', lang, 'Our Story')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
