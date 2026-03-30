'use client';

/**
 * NotificationBell — bell icon with unread badge.
 *
 * Only renders when the customer is authenticated.
 * Clicking it toggles the NotificationPanel open/closed.
 */

import { Bell } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/hooks/useAuth';

interface NotificationBellProps {
  ariaLabel: string;
}

export function NotificationBell({ ariaLabel }: NotificationBellProps) {
  const { customer } = useAuth();
  const { unreadCount, isOpen, openPanel, closePanel } = useNotifications();

  if (!customer) return null;

  const handleClick = () => {
    if (isOpen) {
      closePanel();
    } else {
      openPanel();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative flex h-10 w-10 items-center justify-center rounded-md text-(--color-sand) transition-colors hover:bg-white/10 hover:text-(--color-cream)"
      aria-label={ariaLabel}
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-(--color-cta) px-1 text-[10px] font-700 text-white leading-none">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
