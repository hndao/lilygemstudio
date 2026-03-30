'use client';

/**
 * NotificationContext — in-app notification state for LilyGemStudio.
 *
 * Polls unread count every 60s when a customer is authenticated.
 * Fetches the full list lazily (only when the panel is opened).
 * Applies optimistic updates when marking notifications read.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { AppNotification } from '@/types';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/notificationApi';
import { useAuth } from '@/hooks/useAuth';

// ── Context shape ──────────────────────────────────────────────────────────────

export interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  isOpen: boolean;
  hasMore: boolean;
  currentPage: number;
  openPanel: () => void;
  closePanel: () => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  loadMore: () => Promise<void>;
  /** Force-refresh the unread badge count without opening the panel. */
  refreshCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { customer } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [isLoading, setIsLoading]         = useState(false);
  const [isOpen, setIsOpen]               = useState(false);
  const [currentPage, setCurrentPage]     = useState(1);
  const [hasMore, setHasMore]             = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listFetchedRef = useRef(false);

  // ── Reset when customer logs out ────────────────────────────────────────────
  useEffect(() => {
    if (!customer) {
      setNotifications([]);
      setUnreadCount(0);
      setIsOpen(false);
      setCurrentPage(1);
      setHasMore(false);
      listFetchedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [customer]);

  // ── Poll unread count every 60s when authenticated ──────────────────────────
  useEffect(() => {
    if (!customer) return;

    const poll = () => {
      getUnreadCount().then(setUnreadCount).catch(() => {});
    };

    poll(); // immediate first fetch
    intervalRef.current = setInterval(poll, 60_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [customer]);

  // ── Fetch full list when panel opens (lazy, first open only) ────────────────
  useEffect(() => {
    if (!isOpen || !customer || listFetchedRef.current) return;

    listFetchedRef.current = true;
    setIsLoading(true);
    getNotifications(1)
      .then((res) => {
        setNotifications(res.data);
        setCurrentPage(1);
        setHasMore(res.meta.currentPage < res.meta.lastPage);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isOpen, customer]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);

  const refreshCount = useCallback(async () => {
    if (!customer) return;
    const count = await getUnreadCount();
    setUnreadCount(count);
  }, [customer]);

  const markRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await markNotificationRead(id);
    } catch {
      // Roll back on failure — refetch count
      getUnreadCount().then(setUnreadCount).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: null } : n)),
      );
    }
  }, []);

  const markAllRead = useCallback(async () => {
    // Optimistic: mark all as read
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      // Refetch on failure
      getUnreadCount().then(setUnreadCount).catch(() => {});
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    const nextPage = currentPage + 1;
    setIsLoading(true);
    try {
      const res = await getNotifications(nextPage);
      setNotifications((prev) => [...prev, ...res.data]);
      setCurrentPage(nextPage);
      setHasMore(res.meta.currentPage < res.meta.lastPage);
    } catch {
      // silently ignore
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, currentPage]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        isOpen,
        hasMore,
        currentPage,
        openPanel,
        closePanel,
        markRead,
        markAllRead,
        loadMore,
        refreshCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
