'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getOrders } from '@/lib/commerceApi';
import type { Order } from '@/types';

// Status badge color map
const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-gray-100 text-gray-600',
  confirmed:  'bg-blue-100 text-blue-700',
  processing: 'bg-amber-100 text-amber-700',
  shipped:    'bg-sky-100 text-sky-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-600',
};

const STATUS_LABELS: Record<string, string> = {
  pending:    'Chờ xác nhận',
  confirmed:  'Đã xác nhận',
  processing: 'Đang xử lý',
  shipped:    'Đã gửi hàng',
  delivered:  'Đã giao hàng',
  cancelled:  'Đã hủy',
};

// Icon components (inline SVG, no extra deps)
function PackageIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4 7.55 4.24"/>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.29 7 12 12 20.71 7"/>
      <line x1="12" y1="22" x2="12" y2="12"/>
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
}

// Skeleton for loading state
function AccountSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 w-56 rounded-[10px] bg-(--color-border)" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 rounded-[14px] bg-(--color-border)" />
        ))}
      </div>
      <div className="h-6 w-40 rounded-[8px] bg-(--color-border)" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 rounded-[12px] bg-(--color-border)" />
        ))}
      </div>
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const pathname = usePathname();
  // Derive lang from URL: /vi/account → "vi"
  const lang = pathname.split('/')[1] ?? 'vi';

  const { customer, isLoading, logout } = useAuth();

  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!isLoading && !customer) {
      router.replace(`/${lang}/auth`);
    }
  }, [isLoading, customer, router, lang]);

  // Fetch recent orders
  useEffect(() => {
    if (!customer) return;
    setOrdersLoading(true);
    getOrders(1)
      .then((res) => setRecentOrders(res.data.slice(0, 3)))
      .catch(() => setRecentOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [customer]);

  if (isLoading || !customer) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <AccountSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-[22px] font-700 text-(--color-stone)">
          Xin chào, {customer.name} 👋
        </h1>
        <button
          onClick={logout}
          className="text-sm text-(--color-sand-dark) underline underline-offset-2 hover:text-(--color-stone) transition-colors"
        >
          {/* Logout */}
          Đăng xuất
        </button>
      </div>

      {/* Quick-link cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mb-8">
        {/* Orders card */}
        <Link
          href={`/${lang}/account/orders`}
          className="rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5 flex flex-col gap-2 hover:border-(--color-cta) transition-colors group"
        >
          <span className="text-(--color-cta) group-hover:scale-110 transition-transform w-fit">
            <PackageIcon />
          </span>
          <span className="font-heading text-[14px] font-700 text-(--color-stone) leading-tight">
            {/* My Orders */}
            Đơn hàng của tôi
          </span>
        </Link>

        {/* Addresses card */}
        <Link
          href={`/${lang}/account/addresses`}
          className="rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5 flex flex-col gap-2 hover:border-(--color-cta) transition-colors group"
        >
          <span className="text-(--color-cta) group-hover:scale-110 transition-transform w-fit">
            <MapPinIcon />
          </span>
          <span className="font-heading text-[14px] font-700 text-(--color-stone) leading-tight">
            {/* Addresses */}
            Địa chỉ
          </span>
        </Link>

        {/* Profile card — no link, shows email */}
        <div className="rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5 flex flex-col gap-2 col-span-2 sm:col-span-1">
          <span className="text-(--color-cta) w-fit">
            <UserIcon />
          </span>
          <span className="font-heading text-[14px] font-700 text-(--color-stone) leading-tight">
            {/* Profile / Account */}
            Tài khoản
          </span>
          <span className="text-[12px] text-(--color-sand-dark) truncate">{customer.email}</span>
        </div>
      </div>

      {/* Recent orders section */}
      <section>
        <h2 className="font-heading text-[15px] font-700 text-(--color-stone) mb-3">
          {/* Recent orders */}
          Đơn hàng gần đây
        </h2>

        {ordersLoading ? (
          <div className="space-y-3 animate-pulse">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rounded-[12px] bg-(--color-border)" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="rounded-[14px] border border-(--color-border) bg-(--color-surface) p-6 text-center text-sm text-(--color-sand-dark)">
            {/* No orders yet */}
            Chưa có đơn hàng nào
          </div>
        ) : (
          <ul className="space-y-2">
            {recentOrders.map((order) => (
              <li
                key={order.id}
                className="rounded-[14px] border border-(--color-border) bg-(--color-surface) p-4 flex items-center justify-between gap-3"
              >
                {/* Left: number + badge + date */}
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-700 text-(--color-stone) truncate">
                    #{order.orderNumber}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-600 ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                    <span className="text-[11px] text-(--color-sand-dark)">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {/* Right: total + link */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-sm font-700 text-(--color-cta)">
                    {order.formattedTotal}
                  </span>
                  <Link
                    href={`/${lang}/account/orders/${order.orderNumber}`}
                    className="text-[12px] text-(--color-cta) hover:text-(--color-cta-hover) transition-colors whitespace-nowrap"
                  >
                    {/* View details */}
                    Xem chi tiết →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        {recentOrders.length > 0 && (
          <div className="mt-3 text-right">
            <Link
              href={`/${lang}/account/orders`}
              className="text-sm text-(--color-cta) hover:text-(--color-cta-hover) transition-colors"
            >
              {/* View all orders */}
              Xem tất cả đơn hàng →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
