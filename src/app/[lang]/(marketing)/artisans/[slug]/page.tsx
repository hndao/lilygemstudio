/**
 * /artisans/[slug] — Artisan profile page (RSC + ISR).
 *
 * WHY RSC: Story content + product grid fetched server-side.
 * ISR 3d — artisan profiles are editorial, not real-time.
 * generateStaticParams: pre-renders known artisan slugs at build time.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getArtisan, getArtisans } from '@/lib/api';
import { personJsonLd } from '@/lib/seo';
import { ProductGrid } from '@/components/features/ProductGrid';

export const revalidate = 259200; // 3 days — matches REVALIDATION.ARTISANS in cache.ts

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview_token?: string }>;
}

export async function generateStaticParams() {
  const result = await getArtisans().catch(() => null);
  return (result?.data ?? []).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { preview_token: token } = await searchParams;
  const result = await getArtisan(slug, token).catch(() => null);
  const artisan = result?.data;
  if (!artisan) return { title: 'Artisan | DARIIV' };

  const meta: Metadata = {
    title: `${artisan.name} — Artisan | DARIIV`,
    description: artisan.bioShort,
    openGraph: {
      title: `${artisan.name} | DARIIV`,
      description: artisan.bioShort,
      images: [{ url: artisan.coverImage.src, width: artisan.coverImage.width, height: artisan.coverImage.height }],
      type: 'profile',
    },
  };
  if (token) {
    return { ...meta, robots: { index: false, follow: false } };
  }
  return meta;
}

export default async function ArtisanProfilePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { preview_token: token } = await searchParams;
  const result = await getArtisan(slug, token).catch(() => null);
  const artisan = result?.data;

  if (!artisan) notFound();

  const { name, location, avatar, coverImage, bioShort, storyOrigin, storyCraft, storyPhilosophy, products } = artisan;

  return (
    <main>
      {/* Person JSON-LD — enables Knowledge Graph person entity */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(artisan)) }}
      />

      {/* Hero — cover image with avatar overlay */}
      <section className="relative h-72 w-full overflow-hidden bg-(--color-sand-light) md:h-96">
        <Image src={coverImage.src} alt={coverImage.alt} fill sizes="100vw" priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-(--color-stone)/60 to-transparent" />

        {/* Avatar + name overlay */}
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-center">
          <div className="relative h-20 w-20 overflow-hidden rounded-full ring-4 ring-white">
            <Image src={avatar.src} alt={`Portrait of ${name}`} fill sizes="80px" className="object-cover" />
          </div>
          <div>
            <h1 className="text-2xl font-700 text-white drop-shadow-md md:text-3xl">{name}</h1>
            {location && <p className="text-sm text-white/80">{location}</p>}
          </div>
        </div>
      </section>

      {/* Bio short */}
      {bioShort && (
        <section className="bg-(--color-sand-light) py-10">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <p className="text-base text-(--color-stone)/80 leading-relaxed italic">&ldquo;{bioShort}&rdquo;</p>
          </div>
        </section>
      )}

      {/* Story sections */}
      <section className="bg-(--color-background) py-16 md:py-24">
        <div className="mx-auto max-w-3xl space-y-12 px-4 md:px-6">
          {storyOrigin && (
            <div>
              <h2 className="mb-4 text-xl font-600 text-(--color-stone)">Origin</h2>
              <div className="prose prose-stone max-w-none" dangerouslySetInnerHTML={{ __html: storyOrigin }} />
            </div>
          )}
          {storyCraft && (
            <div>
              <h2 className="mb-4 text-xl font-600 text-(--color-stone)">The Craft</h2>
              <div className="prose prose-stone max-w-none" dangerouslySetInnerHTML={{ __html: storyCraft }} />
            </div>
          )}
          {storyPhilosophy && (
            <div>
              <h2 className="mb-4 text-xl font-600 text-(--color-stone)">Philosophy</h2>
              <div className="prose prose-stone max-w-none" dangerouslySetInnerHTML={{ __html: storyPhilosophy }} />
            </div>
          )}
        </div>
      </section>

      {/* Artisan's products */}
      {products && products.length > 0 && (
        <section className="bg-(--color-sand-light)/40 py-16 md:py-24" aria-labelledby="artisan-products-heading">
          <div className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8">
            <h2 id="artisan-products-heading" className="mb-8 text-xl font-600 text-(--color-stone)">
              Products by {name}
            </h2>
            <ProductGrid products={products} priorityCount={4} />
          </div>
        </section>
      )}
    </main>
  );
}

