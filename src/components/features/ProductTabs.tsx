'use client';

/**
 * ProductTabs — Description / Artisan Story / Reviews tab switcher.
 *
 * BREAKPOINT BEHAVIOUR (from wireframes):
 *  - Mobile:  accordion-style (each section expanded by default)
 *  - Tablet+: horizontal tab bar with content panel below
 *
 * WHY CLIENT COMPONENT: Tab selection state. Content is passed as props
 * from the RSC page — no client-side data fetching.
 */

import { useState } from 'react';
import type { Review } from '@/types';
import { ReviewGrid } from './ReviewGrid';

interface ProductTabsProps {
  description: string;
  brandStory: string;
  reviews: Review[];
  reviewCount: number;
}

type Tab = 'description' | 'story' | 'reviews';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'description', label: 'Description' },
  { id: 'story', label: 'Artisan Story' },
  { id: 'reviews', label: 'Reviews' },
];

export function ProductTabs({ description, brandStory, reviews, reviewCount }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('description');

  return (
    <div className="mt-12">
      {/* Tab bar — tablet+ */}
      <div
        className="hidden border-b border-(--color-border) md:flex"
        role="tablist"
        aria-label="Product information"
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`tab-panel-${id}`}
            onClick={() => setActiveTab(id)}
            className={[
              'px-6 py-3 font-heading text-sm font-600 transition-colors border-b-2 -mb-px',
              activeTab === id
                ? 'border-(--color-sage) text-(--color-sage)'
                : 'border-transparent text-(--color-muted) hover:text-(--color-stone)',
            ].join(' ')}
          >
            {label}{id === 'reviews' ? ` (${reviewCount})` : ''}
          </button>
        ))}
      </div>

      {/* Tab panels — tablet+ */}
      <div className="hidden md:block pt-8">
        {activeTab === 'description' && (
          <div
            id="tab-panel-description"
            role="tabpanel"
            aria-labelledby="tab-description"
            className="prose max-w-none text-(--color-muted) leading-relaxed"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}
        {activeTab === 'story' && (
          <div id="tab-panel-story" role="tabpanel" aria-labelledby="tab-story">
            <h3 className="editorial-title mb-4 text-(--color-stone)">The Artisan Story</h3>
            <p className="leading-relaxed text-(--color-muted)">{brandStory}</p>
          </div>
        )}
        {activeTab === 'reviews' && (
          <div id="tab-panel-reviews" role="tabpanel" aria-labelledby="tab-reviews">
            <ReviewGrid reviews={reviews} totalCount={reviewCount} />
          </div>
        )}
      </div>

      {/* Mobile: stacked accordion sections (always expanded) */}
      <div className="flex flex-col gap-8 md:hidden pt-6">
        <section aria-labelledby="mobile-desc-heading">
          <h3 id="mobile-desc-heading" className="mb-3 font-heading text-base font-700 text-(--color-stone)">
            Description
          </h3>
          <div
            className="text-sm leading-relaxed text-(--color-muted)"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </section>

        <section aria-labelledby="mobile-story-heading">
          <h3 id="mobile-story-heading" className="editorial-title mb-3 text-(--color-stone)">
            The Artisan Story
          </h3>
          <p className="text-sm leading-relaxed text-(--color-muted)">{brandStory}</p>
        </section>

        <ReviewGrid reviews={reviews} totalCount={reviewCount} />
      </div>
    </div>
  );
}

