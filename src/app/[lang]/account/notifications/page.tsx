'use client';

/**
 * /account/notifications — full paginated notification inbox + preference toggles.
 *
 * Redirects to home if unauthenticated. Uses useNotifications() for inbox state.
 * Preference section fetches + saves via notificationApi directly (local state only).
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Bell,
  Package,
  Truck,
  Star,
  UserPlus,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/context/NotificationContext';
import { useDict } from '@/context/DictionaryContext';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreference,
} from '@/lib/notificationApi';
import type { AppNotification } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function typeIcon(type: string) {
  const cls = 'h-5 w-5 shrink-0 text-(--color-cta)';
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

function notificationHref(n: AppNotification, lang: string): string {
  switch (n.type) {
    case 'order_placed':
    case 'order_status_changed':
    case 'shipment_tracking': {
      const orderNumber = n.data.order_number as string | undefined;
      return orderNumber ? `/${lang}/account/orders/${orderNumber}` : `/${lang}/account/orders`;
    }
    default: return '#';
  }
}

function relativeTime(
  isoString: string,
  dict: { just_now: string; minutes_ago: string; hours_ago: string; days_ago: string },
): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return dict.just_now;
  if (mins < 60) return dict.minutes_ago.replace('{n}', String(mins));
  const hours = Math.floor(mins / 60);
  if (hours < 24) return dict.hours_ago.replace('{n}', String(hours));
  return dict.days_ago.replace('{n}', String(Math.floor(hours / 24)));
}

// ── Type label mapping ────────────────────────────────────────────────────────

const TYPE_LABEL_KEYS: Record<string, keyof ReturnType<typeof useDict>['notifications']> = {
  order_placed:          'type_order_placed',
  order_status_changed:  'type_order_status_changed',
  shipment_tracking:     'type_shipment_tracking',
};

// ── Preference Toggle Row ─────────────────────────────────────────────────────

function PreferenceRow({
  label,
  description,
  mailEnabled,
  dbEnabled,
  onToggle,
}: {
  label: string;
  description: string;
  mailEnabled: boolean;
  dbEnabled: boolean;
  onToggle: (channel: 'mail' | 'database', value: boolean) => void;
}) {
  const dict = useDict();
  const n = dict.notifications;
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-(--color-border) last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-600 text-(--color-stone)">{label}</p>
        <p className="text-[12px] text-(--color-muted) mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <label className="flex flex-col items-center gap-1 cursor-pointer">
          <span className="text-[10px] text-(--color-muted)">{n.channel_mail}</span>
          <button
            type="button"
            role="switch"
            aria-checked={mailEnabled}
            onClick={() => onToggle('mail', !mailEnabled)}
            className={[
              'relative w-9 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-cta) focus:ring-offset-1',
              mailEnabled ? 'bg-(--color-cta)' : 'bg-(--color-border)',
            ].join(' ')}
          >
            <span className={[
              'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
              mailEnabled ? 'translate-x-4' : 'translate-x-0',
            ].join(' ')} />
          </button>
        </label>
        <label className="flex flex-col items-center gap-1 cursor-pointer">
          <span className="text-[10px] text-(--color-muted)">{n.channel_database}</span>
          <button
            type="button"
            role="switch"
            aria-checked={dbEnabled}
            onClick={() => onToggle('database', !dbEnabled)}
            className={[
              'relative w-9 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-cta) focus:ring-offset-1',
              dbEnabled ? 'bg-(--color-cta)' : 'bg-(--color-border)',
            ].join(' ')}
          >
            <span className={[
              'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
              dbEnabled ? 'translate-x-4' : 'translate-x-0',
            ].join(' ')} />
          </button>
        </label>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { customer } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const lang = pathname.split('/')[1] ?? 'en';
  const dict = useDict();
  const n = dict.notifications;

  const { notifications, isLoading, hasMore, markRead, markAllRead, loadMore, openPanel } =
    useNotifications();

  // ── Preferences state ──────────────────────────────────────────────────────
  const [prefs, setPrefs] = useState<NotificationPreference[]>([]);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsFeedback, setPrefsFeedback] = useState<'saved' | 'error' | null>(null);

  useEffect(() => {
    openPanel(); // trigger lazy list fetch
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!customer) return;
    getNotificationPreferences().then(setPrefs).catch(() => {});
  }, [customer]);

  useEffect(() => {
    if (!customer) router.replace(`/${lang}/`);
  }, [customer, lang, router]);

  const handlePrefToggle = useCallback(
    (type: string, channel: 'mail' | 'database', value: boolean) => {
      setPrefs((prev) =>
        prev.map((p) => (p.type === type && p.channel === channel ? { ...p, enabled: value } : p)),
      );
    },
    [],
  );

  const savePreferences = useCallback(async () => {
    setPrefsSaving(true);
    setPrefsFeedback(null);
    try {
      await updateNotificationPreferences(prefs);
      setPrefsFeedback('saved');
    } catch {
      setPrefsFeedback('error');
    } finally {
      setPrefsSaving(false);
      setTimeout(() => setPrefsFeedback(null), 3000);
    }
  }, [prefs]);

  if (!customer) return null;

  const getPref = (type: string, channel: 'mail' | 'database') =>
    prefs.find((p) => p.type === type && p.channel === channel)?.enabled ?? true;

  const customerTypes = ['order_placed', 'order_status_changed', 'shipment_tracking'];

  return (
    <div className="space-y-10">

      {/* ── Inbox ─────────────────────────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-[20px] font-700 text-(--color-stone)">{n.title}</h1>
          {notifications.some((notif) => !notif.readAt) && (
            <button
              type="button"
              onClick={() => { void markAllRead(); }}
              className="text-[13px] text-(--color-cta) hover:underline"
            >
              {n.mark_all_read}
            </button>
          )}
        </div>

        {/* Skeleton */}
        {isLoading && notifications.length === 0 && (
          <ul className="divide-y divide-(--color-border) rounded-xl border border-(--color-border) animate-pulse">
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-start gap-4 px-5 py-4">
                <div className="mt-1 h-5 w-5 rounded-full bg-(--color-sand)" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-(--color-sand)" />
                  <div className="h-2 w-1/4 rounded bg-(--color-sand)" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Empty */}
        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <Bell className="h-10 w-10 text-(--color-muted)" />
            <p className="text-[14px] text-(--color-muted)">{n.empty}</p>
          </div>
        )}

        {/* List */}
        {notifications.length > 0 && (
          <ul className="divide-y divide-(--color-border) rounded-xl border border-(--color-border) overflow-hidden">
            {notifications.map((notif) => {
              const href = notificationHref(notif, lang);
              const isLink = href !== '#';
              const inner = (
                <div className="flex items-start gap-4">
                  <span className="mt-1.5 shrink-0">
                    {!notif.readAt ? (
                      <span className="flex h-2.5 w-2.5 rounded-full bg-(--color-cta)" />
                    ) : (
                      <span className="flex h-2.5 w-2.5" />
                    )}
                  </span>
                  {typeIcon(notif.type)}
                  <div className="flex-1 min-w-0">
                    <p className={[
                      'text-[14px] leading-snug',
                      !notif.readAt ? 'font-600 text-(--color-stone)' : 'text-(--color-muted)',
                    ].join(' ')}>
                      {notif.message}
                    </p>
                    <p className="mt-1 text-[11px] text-(--color-muted)">
                      {relativeTime(notif.createdAt, n)}
                    </p>
                  </div>
                </div>
              );

              return (
                <li
                  key={notif.id}
                  className={[
                    'px-5 py-4 transition-colors',
                    !notif.readAt ? 'bg-amber-50/40' : 'bg-(--color-surface)',
                    isLink ? 'hover:bg-(--color-quartz-mist) cursor-pointer' : '',
                  ].join(' ')}
                >
                  {isLink ? (
                    <Link href={href} onClick={() => { if (!notif.readAt) void markRead(notif.id); }}>
                      {inner}
                    </Link>
                  ) : (
                    <div onClick={() => { if (!notif.readAt) void markRead(notif.id); }}>
                      {inner}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {hasMore && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => { void loadMore(); }}
              disabled={isLoading}
              className="text-[13px] text-(--color-cta) hover:underline disabled:opacity-50"
            >
              {isLoading ? '…' : n.load_more}
            </button>
          </div>
        )}
      </section>

      {/* ── Preferences ───────────────────────────────────────────────────── */}
      <section>
        <div className="mb-1">
          <h2 className="text-[17px] font-700 text-(--color-stone)">{n.preferences_title}</h2>
          <p className="text-[13px] text-(--color-muted) mt-0.5">{n.preferences_hint}</p>
        </div>

        {prefs.length === 0 ? (
          <div className="mt-4 animate-pulse space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-(--color-sand)" />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-(--color-border) px-5 bg-(--color-surface)">
            {customerTypes.map((type) => {
              const labelKey = TYPE_LABEL_KEYS[type];
              return (
                <PreferenceRow
                  key={type}
                  label={labelKey ? n[labelKey] as string : type}
                  description=""
                  mailEnabled={getPref(type, 'mail')}
                  dbEnabled={getPref(type, 'database')}
                  onToggle={(channel, value) => handlePrefToggle(type, channel, value)}
                />
              );
            })}
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => { void savePreferences(); }}
            disabled={prefsSaving || prefs.length === 0}
            className="rounded-lg bg-(--color-cta) px-4 py-2 text-[13px] font-600 text-white hover:bg-(--color-cta-hover) disabled:opacity-50 transition-colors"
          >
            {prefsSaving ? '…' : n.preferences_save}
          </button>
          {prefsFeedback === 'saved' && (
            <span className="text-[12px] text-green-600">{n.preferences_saved}</span>
          )}
          {prefsFeedback === 'error' && (
            <span className="text-[12px] text-red-500">{n.preferences_error}</span>
          )}
        </div>
      </section>

    </div>
  );
}
