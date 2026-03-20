'use client';

/**
 * ProductGrid — animated grid of ProductCards.
 *
 * WHY CLIENT COMPONENT: Framer Motion stagger animations require the client.
 * The data is fetched server-side by the parent RSC and passed as props —
 * no client-side fetching happens here.
 *
 * GRID COLUMNS (from wireframes):
 *  - Mobile  (< 768px):  2 columns
 *  - Tablet  (768–1279px): 3 columns
 *  - Desktop (≥ 1280px): 4 columns
 *
 * PERFORMANCE: First 6 cards get priority=true (LCP candidates above the fold).
 * Remaining cards are lazy-loaded by the browser.
 */

import { motion } from 'framer-motion';
import type { ProductCard as ProductCardType } from '@/types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: ProductCardType[];
  /**
   * Number of cards to mark as LCP priority.
   * Homepage: 4 (first row desktop). Catalog: 6 (first 1.5 rows).
   */
  priorityCount?: number;
}

// Stagger config — matches design system: 0.08s between children
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

// Typed as tuple — Framer Motion's Easing type requires [number,number,number,number] for cubic bezier
const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE },
  },
};

export function ProductGrid({ products, priorityCount = 4 }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-(--color-muted)">
        No products found.
      </div>
    );
  }

  // WHY key: whileInView with once:true only fires once per mount. When filters
  // change, the RSC passes new products but the motion.div stays mounted, so
  // new child cards are stuck at opacity:0 (initial="hidden") forever.
  // Deriving a key from product IDs forces a remount on every filter change,
  // which re-triggers the inView check and plays the stagger animation.
  const listKey = products.map((p) => p.id).join('|');

  return (
    <motion.div
      key={listKey}
      className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4 xl:gap-8"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
    >
      {products.map((product, index) => (
        <motion.div key={product.id} variants={itemVariants}>
          <ProductCard
            product={product}
            priority={index < priorityCount}
            sizes="(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw"
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

