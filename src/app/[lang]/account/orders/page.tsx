'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Package, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getOrders } from '@/lib/commerceApi';
import type { Order } from '@/types';

// ── Status maps ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-amber-50 text-amber-700 border border-amber-200',
  confirmed:  'bg-blue-50 text-blue-700 border border-blue-200',
  processing: 'bg-orange-50 text-orange-700 border border-orange-200',
  shipped:    'bg-sky-50 text-sky-700 border border-sky-200',
  delivered:  'bg-green-50 text-green-700 border border-green-200',
  cancelled:  'bg-red-50 text-red-600 border border-red-200',
};

const STATUS_LABELS: Record<string, string> = {
  pending:    'Chờ xác nhận',
  confirmed:  'Đã xác nhận',
  processing: 'Đang xử lý',
  shipped:    'Đã gửi hàng',
  delivered:  'Đã giao hàng',
  cancelled:  'Đã hủy',
};

// ── Skeleton ─────────────────────────────────────────────────────────────────────

function OrdersSkeleton() {
  return (
    <ul className="divide-y divide-(--color-border) animate-pulse">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="py-5 flex items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="h-4 w-32 rounded-full bg-(--color-border)" />
            <div className="h-3 w-20 rounded-full bg-(--color-border)" />
          </div>
          <div className="space-y-2 items-end flex flex-col">
            <div className="h-4 w-24 rounded-full bg-(--color-border)" />
            <div className="h-3 w-12 rounded-full bg-(--color-border)" />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────────

function EmptyOrders({ lang }: { lang: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-(--color-quartz-mist)">
        <Package className="h-9 w-9 text-(--color-cta)" strokeWidth={1.5} />
      </div>
      <h2 className="font-heading text-[17px] font-700 text-(--color-stone) mb-2">
        Chưa có đơn hàng nào
      </h2>
      <p className="text-[13px] text-(--color-sand-dark) mb-6 max-w-xs">
        Hãy khám phá cửa hàng và đặt đơn hàng đầu tiên của bạn nhé!
      </p>
      <Link
        href={`/${lang}/shop`}
        className="inline-flex items-center gap-1.5 rounded-[12px] bg-(--color-cta) px-6 py-3 text-[14px] font-700 text-white hover:bg-(--color-cta-hover) transition-colors"
      >
        Mua sắm ngay
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

// ── Order row ─────────────────────────────────────────────────────────────────────

function OrderRow({ order, lang }: { order: Order; lang: string }) {
  return (
    <li className="py-4 flex items-center justify-between gap-4 group">
      {/* Left */}
      <div className="flex flex-col gap-1.5 min-w-0">
        <span className="text-[14px] font-700 text-(--color-stone) group-hover:text-(--color-cta) transition-colors">
          #{order.orderNumber}
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-600 ${STATUS_COLORS[order.status] ?? 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
          <span className="text-[11px] text-(--color-sand-dark)">
            {new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[14px] font-700 text-(--color-cta)">
          {order.formattedTotal}
        </span>
        <Link
          href={`/${lang}/account/orders/${order.orderNumber}`}
          className="flex h-8 items-center gap-1 rounded-[8px] border border-(--color-border) px-3 text-[12px] font-600 text-(--color-stone) hover:border-(--color-cta) hover:text-(--color-cta) transition-colors"
        >
          Xem
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </li>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const lang = pathname.split('/')[1] ?? 'vi';

  const { customer, isLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !customer) router.replace(`/${lang}/auth`);
  }, [isLoading, customer, router, lang]);

  const fetchOrders = useCallback(async (page: number) => {
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
  }, []);

  useEffect(() => {
    if (!customer) return;
    fetchOrders(currentPage);
  }, [customer, currentPage, fetchOrders]);

  if (isLoading || !customer) return null;

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-[20px] font-700 text-(--color-stone)">
          Đơn hàng của tôi
        </h1>
        {orders.length > 0 && (
          <span className="text-[12px] text-(--color-sand-dark)">
            {orders.length} đơn hàng
          </span>
        )}
      </div>

      {/* Content card */}
      <div className="rounded-[16px] border border-(--color-border) bg-(--color-surface) overflow-hidden">
        {loading ? (
          <div className="px-5">
            <OrdersSkeleton />
          </div>
        ) : orders.length === 0 ? (
          <EmptyOrders lang={lang} />
        ) : (
          <ul className="divide-y divide-(--color-border) px-5">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} lang={lang} />
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
            ← Trước
          </button>
          <span className="text-sm text-(--color-sand-dark)">
            Trang {currentPage} / {lastPage}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
            disabled={currentPage >= lastPage || loading}
            className="h-9 rounded-[10px] border border-(--color-border) bg-(--color-surface) px-4 text-sm font-600 text-(--color-stone) disabled:opacity-40 disabled:cursor-not-allowed hover:border-(--color-cta) transition-colors"
          >
            Tiếp →
          </button>
        </div>
      )}
    </div>
  );
}
