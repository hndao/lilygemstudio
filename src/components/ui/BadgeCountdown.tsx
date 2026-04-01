'use client';

/**
 * BadgeCountdown — live countdown for time-limited badges (Flash Sale, Pre-order, etc.).
 *
 * WHY CLIENT COMPONENT: window.setInterval must run in the browser.
 * Only rendered when expiresAt is within 48 hours — beyond that, a static
 * "Ends soon" label is sufficient.
 *
 * FORMAT:
 *   > 24h  → "2d 3h"
 *   1–24h  → "12:34:56"   (HH:MM:SS, high urgency)
 *   < 1h   → "34:56" in pulsing red (very high urgency)
 *   Expired → null (badge hidden)
 */

import { useEffect, useState } from 'react';

interface BadgeCountdownProps {
  expiresAt: string; // ISO 8601
  textColor: string;
}

function getRemainingMs(expiresAt: string): number {
  return new Date(expiresAt).getTime() - Date.now();
}

function formatRemaining(ms: number): string | null {
  if (ms <= 0) return null;

  const totalSeconds = Math.floor(ms / 1000);
  const days    = Math.floor(totalSeconds / 86400);
  const hours   = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days >= 1) {
    return `${days}d ${hours}h`;
  }
  if (hours >= 1) {
    return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
  }
  return [minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
}

export function BadgeCountdown({ expiresAt, textColor }: BadgeCountdownProps) {
  const [remaining, setRemaining] = useState<string | null>(() =>
    formatRemaining(getRemainingMs(expiresAt))
  );
  const [isUrgent, setIsUrgent] = useState(() => getRemainingMs(expiresAt) < 3_600_000);

  useEffect(() => {
    const tick = () => {
      const ms = getRemainingMs(expiresAt);
      setRemaining(formatRemaining(ms));
      setIsUrgent(ms < 3_600_000);
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!remaining) return null;

  return (
    <span
      style={{ color: textColor, opacity: 0.9 }}
      className={[
        'ml-1 font-mono text-[9px] font-700 tabular-nums',
        isUrgent ? 'animate-pulse' : '',
      ].join(' ')}
      aria-label={`Ends in ${remaining}`}
    >
      ⏱ {remaining}
    </span>
  );
}
