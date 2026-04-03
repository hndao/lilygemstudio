/**
 * ListingCard — grid card for listings (shop grid and homepage featured section).
 *
 * WHY SEPARATE FROM ProductCard: Listings carry price (priceCentsVnd/priceCents),
 * resolvedTitle, and stock state — not the same shape as ProductCard which has
 * review summaries, taglines, and Money objects. Keeping them separate avoids
 * adapter boilerplate and makes the data flow explicit.
 *
 * ROUTING: Links to /[lang]/shop/[slug] using bundleProducts[0].slug.
 * For bundle listings (multiple products), the first product's page is canonical.
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useParams } from 'next/navigation';
import { StarRating } from '@/components/ui/StarRating';
import { ListingBadgePill } from '@/components/ui/ListingBadgePill';
import { useCart } from '@/context/CartContext';
import { useDict } from '@/context/DictionaryContext';
import type { ListingCard as ListingCardType } from '@/types';

interface ListingCardProps {
  listing: ListingCardType;
  priority?: boolean;
  sizes?: string;
  preferVnd?: boolean;
}

export function ListingCard({
  listing,
  priority = false,
  sizes = '(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw',
  preferVnd = false,
}: ListingCardProps) {
  const params = useParams();
  const lang = (params?.lang as string) || 'en';
  const dict = useDict();
  const { addItem } = useCart();
  const [addBusy, setAddBusy] = useState(false);

  const href = listing.slug ? `/${lang}/shop/${listing.slug}` : '#';
  const image = listing.coverImage;
  const isOutOfStock = listing.quantity === 0;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock || addBusy) return;
    setAddBusy(true);
    try { await addItem(listing.id, 1); }
    catch { /* silent — CartContext shows error state */ }
    finally { setAddBusy(false); }
  };
  const isLowStock = listing.quantity != null && listing.quantity > 0 && listing.quantity <= 10;

  const primaryPrice = preferVnd
    ? (listing.formattedPriceVnd ?? listing.formattedPrice)
    : (listing.formattedPrice ?? listing.formattedPriceVnd);
  const comparePrice = preferVnd
    ? (listing.comparePriceCentsVnd != null ? listing.formattedCompareAtPriceVnd : listing.comparePriceCents != null ? listing.formattedCompareAtPrice : null)
    : (listing.comparePriceCents != null ? listing.formattedCompareAtPrice : listing.comparePriceCentsVnd != null ? listing.formattedCompareAtPriceVnd : null);
  const isOnSale = comparePrice != null;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface) shadow-(--shadow-soft) transition-shadow duration-200 hover:shadow-(--shadow-card)">
      {/* Image wrapper */}
      <Link href={href} className="relative block aspect-square overflow-hidden bg-(--color-sand-light)">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes={sizes}
            priority={priority}
            placeholder={image.blurDataURL ? 'blur' : 'empty'}
            blurDataURL={image.blurDataURL}
            className={[
              'object-cover transition-transform duration-500 group-hover:scale-105',
              isOutOfStock ? 'opacity-60' : '',
            ].join(' ')}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-(--color-sand-light) text-(--color-sand-dark) text-sm">
            No image
          </div>
        )}

        {/* Quick-add button — hover on desktop, always visible on mobile */}
        {!isOutOfStock && (
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={addBusy}
            className={[
              'absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5',
              'rounded-[10px] bg-(--color-cta)/90 py-2 text-[12px] font-600 text-white backdrop-blur-sm',
              'transition-all duration-200 disabled:opacity-60',
              'opacity-100 translate-y-0',
              'md:opacity-0 md:translate-y-1 md:group-hover:opacity-100 md:group-hover:translate-y-0',
            ].join(' ')}
            aria-label={dict.catalog.add_to_cart_aria.replace('{name}', listing.resolvedTitle)}
          >
            <ShoppingCart className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {addBusy ? '...' : dict.catalog.add_to_cart}
          </button>
        )}

        {/* Badge overlay — top-left stack */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {/* Stock state always takes priority */}
          {isOutOfStock ? (
            <div className="rounded-full bg-(--color-stone) px-2 py-0.5 text-[10px] font-600 text-white">
              {dict.catalog.out_of_stock}
            </div>
          ) : (
            <>
              {/* Admin listing badges — promotion first, max 2 shown on card */}
              {listing.badges && listing.badges.slice(0, 2).map((badge) => (
                <ListingBadgePill key={badge.id} badge={badge} size="sm" />
              ))}
              {/* Auto stock badges when no admin badges cover urgency */}
              {(!listing.badges || listing.badges.length === 0) && isOnSale && (
                <div className="rounded-full bg-(--color-promo) px-2 py-0.5 text-[10px] font-600 text-white">
                  {dict.catalog.on_sale}
                </div>
              )}
              {(!listing.badges || listing.badges.length === 0) && !isOnSale && isLowStock && (
                <div className="rounded-full bg-(--color-cta) px-2 py-0.5 text-[10px] font-600 text-white">
                  {dict.catalog.low_stock.replace('{n}', String(listing.quantity))}
                </div>
              )}
            </>
          )}
        </div>
      </Link>

      {/* Content area */}
      <div className="flex flex-1 flex-col p-4">
        <Link href={href} className="outline-none">
          <h3 className="line-clamp-2 font-heading text-base font-semibold text-(--color-foreground) transition-colors group-hover:text-(--color-terracotta)">
            {listing.resolvedTitle}
          </h3>
        </Link>

        {/* Description tagline */}
        {listing.description && (
          <p className="mt-1 line-clamp-1 text-xs text-(--color-muted)">
            {listing.description}
          </p>
        )}

        {/* Star ratings */}
        {listing.averageRating != null && listing.averageRating > 0 && (
          <div className="mt-1.5">
            <StarRating
              rating={listing.averageRating}
              count={listing.reviewCount ?? undefined}
              size="sm"
            />
          </div>
        )}

        {/* Price row */}
        <div className="mt-auto pt-2 flex flex-wrap items-baseline gap-1.5">
          {primaryPrice && (
            <span className={[
              'font-heading text-sm font-700',
              isOnSale ? 'text-(--color-promo)' : 'text-(--color-terracotta-dark)',
            ].join(' ')}>
              {primaryPrice}
            </span>
          )}
          {comparePrice && (
            <span className="text-xs text-(--color-sand-dark) line-through">
              {comparePrice}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
