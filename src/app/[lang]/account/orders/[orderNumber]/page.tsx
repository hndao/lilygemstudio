'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { getOrder } from '@/lib/commerceApi';
import type { Order } from '@/types';

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-gray-100 text-gray-600',
  confirmed:  'bg-blue-100 text-blue-700',
  processing: 'bg-amber-100 text-amber-700',
  shipped:    'bg-sky-100 text-sky-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-600',
};

// ── Timeline ───────────────────────────────────────────────────────────────────

const TIMELINE_STEPS: { key: string; label: string }[] = [
  { key: 'pending',    label: 'Chờ xác nhận' },
  { key: 'confirmed',  label: 'Đã xác nhận' },
  { key: 'processing', label: 'Đang xử lý' },
  { key: 'shipped',    label: 'Đã gửi hàng' },
  { key: 'delivered',  label: 'Đã giao hàng' },
];

// Index of a status in the happy path (returns -1 if cancelled or unknown)
function statusIndex(status: string): number {
  return TIMELINE_STEPS.findIndex((s) => s.key === status);
}

function StatusTimeline({ status }: { status: string }) {
  const currentIdx = statusIndex(status);
  const isCancelled = status === 'cancelled';

  if (isCancelled) {
    return (
      <div className="rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5 mb-4">
        <p className="text-sm font-600 text-red-600 text-center">
          {/* Order cancelled */}
          Đơn hàng đã bị hủy
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5 mb-4">
      <h2 className="font-heading text-[15px] font-700 text-(--color-stone) mb-4">
        {/* Order status */}
        Trạng thái đơn hàng
      </h2>
      <ol className="relative flex flex-col gap-0">
        {TIMELINE_STEPS.map((step, idx) => {
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <li key={step.key} className="flex items-start gap-3 pb-4 last:pb-0">
              {/* Dot + line */}
              <div className="relative flex flex-col items-center shrink-0 w-5">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center z-10 ${
                    isDone
                      ? 'bg-(--color-cta)'
                      : 'bg-(--color-border)'
                  } ${isCurrent ? 'ring-2 ring-(--color-cta) ring-offset-2' : ''}`}
                >
                  {isDone && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                {/* Connector line */}
                {idx < TIMELINE_STEPS.length - 1 && (
                  <span
                    className={`w-0.5 flex-1 mt-1 ${isDone && idx < currentIdx ? 'bg-(--color-cta)' : 'bg-(--color-border)'}`}
                    style={{ minHeight: '20px' }}
                  />
                )}
              </div>
              {/* Label */}
              <span
                className={`text-sm pt-0.5 ${
                  isCurrent
                    ? 'font-700 text-(--color-stone)'
                    : isDone
                    ? 'text-(--color-stone)'
                    : 'text-(--color-sand-dark)'
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function OrderDetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-5 w-32 rounded bg-(--color-border)" />
      <div className="h-40 rounded-[14px] bg-(--color-border)" />
      <div className="h-32 rounded-[14px] bg-(--color-border)" />
      <div className="h-28 rounded-[14px] bg-(--color-border)" />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const lang = pathname.split('/')[1] ?? 'vi';
  const orderNumber = Array.isArray(params.orderNumber)
    ? params.orderNumber[0]
    : (params.orderNumber as string);

  const { customer, isLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!isLoading && !customer) {
      router.replace(`/${lang}/auth`);
    }
  }, [isLoading, customer, router, lang]);

  // Fetch order
  useEffect(() => {
    if (!customer || !orderNumber) return;
    setLoading(true);
    getOrder(orderNumber)
      .then(setOrder)
      .catch(() => setError('Không tìm thấy đơn hàng.'))
      .finally(() => setLoading(false));
  }, [customer, orderNumber]);

  if (isLoading || !customer || loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <OrderDetailSkeleton />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <p className="text-sm text-red-600 mb-4">{error ?? 'Lỗi tải đơn hàng.'}</p>
        <Link href={`/${lang}/account/orders`} className="text-sm text-(--color-cta)">
          ← Đơn hàng
        </Link>
      </div>
    );
  }

  // Bank transfer instructions: shown when status=pending and notes contains "bank"
  const showBankTransfer =
    order.status === 'pending' && (order.notes ?? '').toLowerCase().includes('bank');

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href={`/${lang}/account/orders`}
        className="inline-flex items-center gap-1 text-sm text-(--color-sand-dark) hover:text-(--color-stone) transition-colors mb-6"
      >
        {/* ← Orders */}
        ← Đơn hàng
      </Link>

      {/* Order header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-heading text-[20px] font-700 text-(--color-stone)">
          #{order.orderNumber}
        </h1>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-600 ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}
        >
          {order.status === 'pending' ? 'Chờ xác nhận'
            : order.status === 'confirmed' ? 'Đã xác nhận'
            : order.status === 'processing' ? 'Đang xử lý'
            : order.status === 'shipped' ? 'Đã gửi hàng'
            : order.status === 'delivered' ? 'Đã giao hàng'
            : order.status === 'cancelled' ? 'Đã hủy'
            : order.status}
        </span>
      </div>

      {/* Status timeline */}
      <StatusTimeline status={order.status} />

      {/* Bank transfer instructions */}
      {showBankTransfer && (
        <div className="rounded-[14px] border border-amber-200 bg-amber-50 p-5 mb-4">
          <h2 className="font-heading text-[15px] font-700 text-(--color-stone) mb-3">
            {/* Payment instructions */}
            Hướng dẫn thanh toán
          </h2>
          {order.paidAt ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-600 text-green-700">
              {/* Paid */}
              ✓ Đã thanh toán
            </span>
          ) : (
            <div className="space-y-1.5 text-sm text-(--color-stone)">
              <p className="font-600">Chuyển khoản ngân hàng</p>
              {/* Placeholder bank info */}
              <p>Ngân hàng: <span className="font-600">MB Bank</span></p>
              <p>Số tài khoản: <span className="font-600">0123456789</span></p>
              <p>Nội dung: <span className="font-600">DH {order.orderNumber}</span></p>
              <p className="text-(--color-sand-dark) text-[12px] pt-1">
                {/* Please transfer within 24 hours */}
                Vui lòng chuyển khoản trong vòng 24 giờ để đơn hàng được xử lý.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Order items */}
      <div className="rounded-[14px] border border-(--color-border) bg-(--color-surface) overflow-hidden mb-4">
        <h2 className="font-heading text-[15px] font-700 text-(--color-stone) px-5 pt-5 mb-3">
          {/* Items */}
          Sản phẩm
        </h2>
        <ul className="divide-y divide-(--color-border)">
          {order.items.map((item) => {
            const snap = item.listingSnapshot;
            const cover = snap.cover_image;
            return (
              <li key={item.id} className="px-5 py-4 flex items-start gap-3">
                {/* Thumbnail */}
                {cover ? (
                  <div className="shrink-0 w-14 h-14 rounded-[10px] overflow-hidden border border-(--color-border) bg-(--color-background)">
                    <Image
                      src={cover.src}
                      alt={cover.alt}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="shrink-0 w-14 h-14 rounded-[10px] bg-(--color-quartz-mist) border border-(--color-border)" />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-600 text-(--color-stone) leading-tight truncate">
                    {snap.resolvedTitle}
                  </p>
                  {snap.sku && (
                    <p className="text-[11px] text-(--color-sand-dark) mt-0.5">
                      SKU: {snap.sku}
                    </p>
                  )}
                  <p className="text-[12px] text-(--color-sand-dark) mt-1">
                    {/* qty × unit price */}
                    {item.quantity} ×{' '}
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(item.unitPriceCents)}
                  </p>
                </div>

                {/* Line total */}
                <span className="text-sm font-700 text-(--color-stone) shrink-0">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(item.totalPriceCents)}
                </span>
              </li>
            );
          })}
        </ul>

        {/* Totals breakdown */}
        <div className="border-t border-(--color-border) px-5 py-4 space-y-2">
          <div className="flex justify-between text-sm text-(--color-sand-dark)">
            <span>Tạm tính</span>{/* Subtotal */}
            <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.subtotalCents)}</span>
          </div>
          {order.discountCents > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>
                Giảm giá{order.couponCode ? ` (${order.couponCode})` : ''}
              </span>{/* Discount */}
              <span>−{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-(--color-sand-dark)">
            <span>Phí vận chuyển</span>{/* Shipping */}
            <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.shippingCents)}</span>
          </div>
          <div className="flex justify-between text-sm font-700 text-(--color-stone) pt-1 border-t border-(--color-border)">
            <span>Tổng cộng</span>{/* Total */}
            <span className="text-(--color-cta)">{order.formattedTotal}</span>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      <div className="rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5">
        <h2 className="font-heading text-[15px] font-700 text-(--color-stone) mb-3">
          {/* Shipping address */}
          Địa chỉ giao hàng
        </h2>
        <div className="text-sm text-(--color-stone) space-y-0.5">
          <p className="font-600">{order.shippingAddress.recipientName}</p>
          {order.shippingAddress.phone && (
            <p className="text-(--color-sand-dark)">{order.shippingAddress.phone}</p>
          )}
          <p>{order.shippingAddress.line1}</p>
          {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
          <p>
            {[order.shippingAddress.city, order.shippingAddress.state]
              .filter(Boolean)
              .join(', ')}
          </p>
          <p>{order.shippingAddress.countryCode}</p>
        </div>
      </div>

      {/* Created at */}
      <p className="mt-4 text-[12px] text-(--color-sand-dark) text-right">
        {/* Order date */}
        Đặt ngày {new Date(order.createdAt).toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
    </div>
  );
}
