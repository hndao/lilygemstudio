/**
 * ListingBadgePill — renders a single admin-defined listing badge.
 *
 * Colors are set via inline style (hex values from the DB) because the
 * values are dynamic and admin-configurable.
 *
 * When the badge has an `expiresAt` within 48 hours, a live countdown
 * is appended (BadgeCountdown client component). Beyond 48 h only the
 * badge name is shown to keep the card clean.
 */
import type { ListingBadge } from '@/types';
import { BadgeCountdown } from './BadgeCountdown';

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

interface ListingBadgePillProps {
  badge: ListingBadge;
  size?: 'sm' | 'md';
}

export function ListingBadgePill({ badge, size = 'sm' }: ListingBadgePillProps) {
  const showCountdown =
    badge.expiresAt != null &&
    new Date(badge.expiresAt).getTime() - Date.now() > 0 &&
    new Date(badge.expiresAt).getTime() - Date.now() < FORTY_EIGHT_HOURS_MS;

  return (
    <span
      style={{ backgroundColor: badge.color, color: badge.textColor }}
      className={[
        'inline-flex items-center rounded-full font-600 leading-none whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
      ].join(' ')}
    >
      {badge.name}
      {showCountdown && (
        <BadgeCountdown expiresAt={badge.expiresAt!} textColor={badge.textColor} />
      )}
    </span>
  );
}
