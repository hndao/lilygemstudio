/**
 * LilyGemStudio — Notification API Client
 *
 * Handles all in-app notification API calls: list, unread count, mark read.
 * Requires an authenticated customer (Bearer token in localStorage).
 */

import type { AppNotification, PaginatedResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';
const TOKEN_KEY = 'lily_auth_token';
const SITE = 'lilygemstudio';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

async function notifFetch<T>(
  endpoint: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...(opts.body !== undefined && { body: JSON.stringify(opts.body) }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      (data as { message?: string }).message ?? `HTTP ${res.status}: ${endpoint}`,
    );
  }
  return data as T;
}

/** Fetch paginated notifications for the current customer. */
export async function getNotifications(
  page = 1,
): Promise<PaginatedResponse<AppNotification>> {
  return notifFetch<PaginatedResponse<AppNotification>>(
    `/notifications?site=${SITE}&page=${page}`,
  );
}

/** Fetch the unread notification count for the bell badge. */
export async function getUnreadCount(): Promise<number> {
  try {
    const res = await notifFetch<{ count: number }>(
      `/notifications/unread-count?site=${SITE}`,
    );
    return res.count;
  } catch {
    return 0;
  }
}

/** Mark a single notification as read. */
export async function markNotificationRead(id: string): Promise<void> {
  await notifFetch(`/notifications/${id}/read`, { method: 'PATCH' });
}

/** Mark all notifications as read. */
export async function markAllNotificationsRead(): Promise<void> {
  await notifFetch(`/notifications/read-all?site=${SITE}`, { method: 'POST' });
}

// ── Preferences ────────────────────────────────────────────────────────────────

export interface NotificationPreference {
  type: string;
  channel: 'mail' | 'database';
  enabled: boolean;
}

/** Fetch all customer notification preferences (merged defaults + overrides). */
export async function getNotificationPreferences(): Promise<NotificationPreference[]> {
  return notifFetch<NotificationPreference[]>('/notifications/preferences');
}

/** Upsert customer notification preferences. */
export async function updateNotificationPreferences(
  prefs: NotificationPreference[],
): Promise<void> {
  await notifFetch('/notifications/preferences', { method: 'PUT', body: prefs });
}
