'use client';

import { useEffect, useState, useCallback } from 'react';
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

// Loading skeleton rows
function OrdersSkeleton() {
  return (
    <ul className="space-y-0 divide-y divide-(--color-border) animate-pulse">
      {[0, 1, 2, 3, 4].map((i) => (
        <li key={i} className="py-4 flex items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="h-4 w-28 rounded bg-(--color-border)" />
            <div className="h-3 w-20 rounded bg-(--color-border)" />
          </div>
          <div className="space-y-2 items-end flex flex-col">
            <div className="h-4 w-20 rounded bg-(--color-border)" />
            <div className="h-3 w-10 rounded bg-(--color-border)" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const lang = pathname.split('/')[1] ?? 'vi';

  const { customer, isLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!isLoading && !customer) {
      router.replace(`/${lang}/auth`);
    }
  }, [isLoading, customer, router, lang]);

  const fetchOrders = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const res = await getOrders(page);
        setOrders(res.data);
        setCurrentPage(res.meta.currentPage);
        setLastPage(res.meta.lastPage);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!customer) return;
    fetchOrders(currentPage);
  }, [customer, currentPage, fetchOrders]);

  if (isLoading || !customer) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <OrdersSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href={`/${lang}/account`}
        className="inline-flex items-center gap-1 text-sm text-(--color-sand-dark) hover:text-(--color-stone) transition-colors mb-6"
      >
        {/* ← Account */}
        ← Tài khoản
      </Link>

      <h1 className="font-heading text-[20px] font-700 text-(--color-stone) mb-6">
        {/* My Orders */}
        Đơn hàng của tôi
      </h1>

      <div className="rounded-[14px] border border-(--color-border) bg-(--color-surface) overflow-hidden">
        {loading ? (
          <div className="px-5">
            <OrdersSkeleton />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-sm text-(--color-sand-dark)">
            {/* No orders */}
            Không có đơn hàng nào
          </div>
        ) : (
          <ul className="divide-y divide-(--color-border)">
            {orders.map((order) => (
              <li key={order.id} className="px-5 py-4 flex items-center justify-between gap-4">
                {/* Left */}
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-700 text-(--color-stone)">
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

                {/* Right */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-sm font-700 text-(--color-cta)">
                    {order.formattedTotal}
                  </span>
                  <Link
                    href={`/${lang}/account/orders/${order.orderNumber}`}
                    className="text-[12px] text-(--color-cta) hover:text-(--color-cta-hover) transition-colors"
                  >
                    {/* View */}
                    Xem →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1 || loading}
            className="h-9 rounded-[10px] border border-(--color-border) bg-(--color-surface) px-4 text-sm font-600 text-(--color-stone) disabled:opacity-40 disabled:cursor-not-allowed hover:border-(--color-cta) transition-colors"
          >
            {/* Previous */}
            ← Trước
          </button>
          <span className="text-sm text-(--color-sand-dark)">
            {currentPage} / {lastPage}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
            disabled={currentPage >= lastPage || loading}
            className="h-9 rounded-[10px] border border-(--color-border) bg-(--color-surface) px-4 text-sm font-600 text-(--color-stone) disabled:opacity-40 disabled:cursor-not-allowed hover:border-(--color-cta) transition-colors"
          >
            {/* Next */}
            Tiếp →
          </button>
        </div>
      )}
    </div>
  );
}
