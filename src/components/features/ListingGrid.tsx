'use client';

/**
 * ListingGrid — animated grid of ListingCards.
 *
 * WHY SEPARATE FROM ProductGrid: Listings have a different data shape (no
 * reviewSummary, no tagline, price from listing not product). Using a separate
 * component keeps the type contract explicit and avoids adapter shims.
 *
 * Same stagger animation pattern as ProductGrid — consistent motion design.
 */

import { motion } from 'framer-motion';
import type { ListingCard as ListingCardType } from '@/types';
import { ListingCard } from './ListingCard';

interface ListingGridProps {
  listings: ListingCardType[];
  priorityCount?: number;
  preferVnd?: boolean;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE },
  },
};

export function ListingGrid({ listings, priorityCount = 4, preferVnd = false }: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-(--color-muted)">
        Không tìm thấy sản phẩm.
      </div>
    );
  }

  const listKey = listings.map((l) => l.id).join('|');

  return (
    <motion.div
      key={listKey}
      className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4 xl:gap-8"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
    >
      {listings.map((listing, index) => (
        <motion.div key={listing.id} variants={itemVariants}>
          <ListingCard
            listing={listing}
            priority={index < priorityCount}
            sizes="(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw"
            preferVnd={preferVnd}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
