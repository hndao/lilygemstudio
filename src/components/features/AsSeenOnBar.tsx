'use client';

/**
 * AsSeenOnBar — social proof strip below the hero.
 *
 * WHY THIS EXISTS: 80% of DARIIV traffic arrives from Pinterest and TikTok.
 * Showing these logos immediately below the hero reinforces that the brand
 * is present on the platforms users just came from — a trust signal that
 * reduces bounce rate on first visit.
 *
 * Platforms are driven entirely by what the admin sets in Settings → Social Links.
 * A platform is only shown if its URL is non-empty. If no platforms are configured
 * the bar renders nothing (returns null) so it doesn't appear as an empty strip.
 */

import { motion } from 'framer-motion';
import type { SiteSettings } from '@/types';

/** Display metadata for each social key the admin can configure */
const PLATFORM_META: Partial<Record<keyof SiteSettings['social'], { name: string; icon: string }>> = {
  social_instagram: { name: 'Instagram', icon: '📷' },
  social_facebook:  { name: 'Facebook',  icon: '👥' },
  social_twitter:   { name: 'X / Twitter', icon: '🐦' },
  social_pinterest: { name: 'Pinterest', icon: '📌' },
  social_youtube:   { name: 'YouTube',   icon: '▶️' },
  // social_zalo / social_messenger are contact channels, not "As Seen On" platforms
};

interface AsSeenOnBarProps {
  social?: SiteSettings['social'];
}

export function AsSeenOnBar({ social }: AsSeenOnBarProps) {
  // Build the list of platforms that have a URL set in admin Settings
  const platforms = (Object.entries(social ?? {}) as [keyof SiteSettings['social'], string][])
    .filter(([key, url]) => !!url && !!PLATFORM_META[key])
    .map(([key, url]) => ({ ...PLATFORM_META[key]!, url }));

  // Don't render the bar at all if no social links are configured
  if (platforms.length === 0) return null;

  return (
    <section
      className="border-y border-(--color-border) bg-(--color-sand-light) py-4"
      aria-label="As seen on"
    >
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-3 px-4 sm:flex-row sm:justify-center sm:gap-8 md:px-6 lg:px-8">
        <span className="brand-label shrink-0">As Seen On</span>

        <div className="flex items-center gap-6">
          {platforms.map((platform, i) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <a
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={platform.name}
                className="flex items-center gap-1.5 text-sm font-500 text-(--color-stone) transition-colors hover:text-(--color-sage)"
              >
                <span aria-hidden="true" className="text-base">{platform.icon}</span>
                <span>{platform.name}</span>
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

