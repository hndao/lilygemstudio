'use client';

/**
 * NotificationPanel — dropdown notification inbox.
 *
 * Renders below the bell icon (same pattern as the profile dropdown in Header).
 * Closes on outside click. Shows unread dot, relative time, type icon, message.
 */

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bell,
  Package,
  Truck,
  Star,
  UserPlus,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import type { AppNotification } from '@/types';

// ── Type → icon map ────────────────────────────────────────────────────────────

function typeIcon(type: string) {
  const cls = 'h-4 w-4 shrink-0';
  switch (type) {
    case 'order_placed':         return <Package className={cls} />;
    case 'order_status_changed': return <RefreshCw className={cls} />;
    case 'shipment_tracking':    return <Truck className={cls} />;
    case 'new_review':           return <Star className={cls} />;
    case 'new_customer':         return <UserPlus className={cls} />;
    case 'low_stock':            return <AlertTriangle className={cls} />;
    default:                     return <Bell className={cls} />;
  }
}

// ── Notification link resolution ───────────────────────────────────────────────

function notificationHref(n: AppNotification, lang: string): string {
  const base = `/${lang}`;
  switch (n.type) {
    case 'order_placed':
    case 'order_status_changed':
    case 'shipment_tracking': {
      const orderNumber = n.data.order_number as string | undefined;
      return orderNumber
        ? `${base}/account/orders/${orderNumber}`
        : `${base}/account/orders`;
    }
    default:
      return `${base}/account/notifications`;
  }
}

// ── Relative time ──────────────────────────────────────────────────────────────

function relativeTime(
  isoString: string,
  dict: {
    just_now: string;
    minutes_ago: string;
    hours_ago: string;
    days_ago: string;
  },
): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return dict.just_now;
  if (mins < 60) return dict.minutes_ago.replace('{n}', String(mins));
  const hours = Math.floor(mins / 60);
  if (hours < 24) return dict.hours_ago.replace('{n}', String(hours));
  const days = Math.floor(hours / 24);
  return dict.days_ago.replace('{n}', String(days));
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface NotificationPanelProps {
  lang: string;
  dict: {
    title: string;
    empty: string;
    mark_all_read: string;
    view_all: string;
    just_now: string;
    minutes_ago: string;
    hours_ago: string;
    days_ago: string;
  };
  onClose: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function NotificationPanel({ lang, dict, onClose }: NotificationPanelProps) {
  const { notifications, isLoading, markRead, markAllRead } = useNotifications();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleItemClick = async (n: AppNotification) => {
    if (!n.readAt) await markRead(n.id);
    onClose();
  };

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={dict.title}
      className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-(--color-border) bg-(--color-surface) shadow-lg overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-(--color-border) px-4 py-3">
        <span className="text-[13px] font-700 text-(--color-stone)">{dict.title}</span>
        <button
          type="button"
          onClick={() => { void markAllRead(); }}
          className="text-[11px] text-(--color-cta) hover:underline"
        >
          {dict.mark_all_read}
        </button>
      </div>

      {/* List */}
      <div className="max-h-[360px] overflow-y-auto divide-y divide-(--color-border)">
        {isLoading && notifications.length === 0 && (
          <div className="px-4 py-8 text-center text-[12px] text-(--color-muted) animate-pulse">
            {dict.empty}
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="px-4 py-8 text-center text-[12px] text-(--color-muted)">
            {dict.empty}
          </div>
        )}

        {notifications.slice(0, 8).map((n) => (
          <Link
            key={n.id}
            href={notificationHref(n, lang)}
            onClick={() => { void handleItemClick(n); }}
            className={[
              'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-(--color-quartz-mist)',
              !n.readAt ? 'bg-amber-50/40' : '',
            ].join(' ')}
          >
            {/* Unread dot */}
            <span className="mt-1 shrink-0">
              {!n.readAt ? (
                <span className="flex h-2 w-2 rounded-full bg-(--color-cta)" />
              ) : (
                <span className="flex h-2 w-2 rounded-full bg-transparent" />
              )}
            </span>

            {/* Icon */}
            <span className="mt-0.5 text-(--color-cta) shrink-0">
              {typeIcon(n.type)}
            </span>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className={[
                'text-[12px] leading-snug truncate',
                !n.readAt ? 'font-600 text-(--color-stone)' : 'text-(--color-muted)',
              ].join(' ')}>
                {n.message}
              </p>
              <p className="mt-0.5 text-[10px] text-(--color-muted)">
                {relativeTime(n.createdAt, dict)}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-(--color-border) px-4 py-2.5 text-center">
        <Link
          href={`/${lang}/account/notifications`}
          onClick={onClose}
          className="text-[12px] text-(--color-cta) hover:underline"
        >
          {dict.view_all}
        </Link>
      </div>
    </div>
  );
}
