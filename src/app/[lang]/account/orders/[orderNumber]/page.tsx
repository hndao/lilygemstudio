'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useDict } from '@/context/DictionaryContext';
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

// ── Formatters ─────────────────────────────────────────────────────────────────

function fmtVnd(cents: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cents);
}

function fmtUsd(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

// ── Timeline ───────────────────────────────────────────────────────────────────

const TIMELINE_KEYS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const;

function statusIndex(status: string): number {
  return TIMELINE_KEYS.indexOf(status as typeof TIMELINE_KEYS[number]);
}

function StatusTimeline({ status }: { status: string }) {
  const dict = useDict();
  const a = dict.account;
  const oc = dict.order_confirmation;
  const currentIdx = statusIndex(status);
  const isCancelled = status === 'cancelled';

  const statusLabels: Record<string, string> = {
    pending:    oc.status_pending,
    confirmed:  oc.status_confirmed,
    processing: oc.status_processing,
    shipped:    oc.status_shipped,
    delivered:  oc.status_delivered,
  };

  if (isCancelled) {
    return (
      <div className="rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5 mb-4">
        <p className="text-sm font-600 text-red-600 text-center">{a.order_cancelled}</p>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5 mb-4">
      <h2 className="font-heading text-[15px] font-700 text-(--color-stone) mb-4">
        {oc.order_status}
      </h2>
      <ol className="relative flex flex-col gap-0">
        {TIMELINE_KEYS.map((key, idx) => {
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <li key={key} className="flex items-start gap-3 pb-4 last:pb-0">
              <div className="relative flex flex-col items-center shrink-0 w-5">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center z-10 ${
                    isDone ? 'bg-(--color-cta)' : 'bg-(--color-border)'
                  } ${isCurrent ? 'ring-2 ring-(--color-cta) ring-offset-2' : ''}`}
                >
                  {isDone && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                {idx < TIMELINE_KEYS.length - 1 && (
                  <span
                    className={`w-0.5 flex-1 mt-1 ${isDone && idx < currentIdx ? 'bg-(--color-cta)' : 'bg-(--color-border)'}`}
                    style={{ minHeight: '20px' }}
                  />
                )}
              </div>
              <span
                className={`text-sm pt-0.5 ${
                  isCurrent ? 'font-700 text-(--color-stone)' : isDone ? 'text-(--color-stone)' : 'text-(--color-sand-dark)'
                }`}
              >
                {statusLabels[key]}
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
  const lang = pathname.split('/')[1] ?? 'en';
  const orderNumber = Array.isArray(params.orderNumber)
    ? params.orderNumber[0]
    : (params.orderNumber as string);

  const dict = useDict();
  const a = dict.account;
  const oc = dict.order_confirmation;

  const { customer, isLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derive isVn from geo cookie set by middleware
  const [isVn, setIsVn] = useState(false);
  useEffect(() => {
    setIsVn(document.documentElement.classList.contains('country-vn'));
  }, []);

  const fmt = (cents: number) => isVn ? fmtVnd(cents) : fmtUsd(cents);

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
      .catch(() => setError(a.err_order_not_found))
      .finally(() => setLoading(false));
  }, [customer, orderNumber, a.err_order_not_found]);

  if (isLoading || !customer || loading) {
    return <OrderDetailSkeleton />;
  }

  if (error || !order) {
    return (
      <div>
        <p className="text-sm text-red-600 mb-4">{error ?? a.err_load_order}</p>
        <Link href={`/${lang}/account/orders`} className="text-sm text-(--color-cta)">
          {a.back_to_orders}
        </Link>
      </div>
    );
  }

  // Status badge label
  const statusLabel: Record<string, string> = {
    pending:    oc.status_pending,
    confirmed:  oc.status_confirmed,
    processing: oc.status_processing,
    shipped:    oc.status_shipped,
    delivered:  oc.status_delivered,
    cancelled:  oc.status_cancelled,
  };

  // Bank transfer instructions: shown when status=pending and notes contains "bank"
  const showBankTransfer =
    order.status === 'pending' && (order.notes ?? '').toLowerCase().includes('bank');

  return (
    <div>
      {/* Back link */}
      <Link
        href={`/${lang}/account/orders`}
        className="inline-flex items-center gap-1 text-sm text-(--color-sand-dark) hover:text-(--color-stone) transition-colors mb-6"
      >
        {a.back_to_orders}
      </Link>

      {/* Order header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-heading text-[20px] font-700 text-(--color-stone)">
          #{order.orderNumber}
        </h1>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-600 ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}
        >
          {statusLabel[order.status] ?? order.status}
        </span>
      </div>

      {/* Status timeline */}
      <StatusTimeline status={order.status} />

      {/* Bank transfer instructions */}
      {showBankTransfer && (
        <div className="rounded-[14px] border border-amber-200 bg-amber-50 p-5 mb-4">
          <h2 className="font-heading text-[15px] font-700 text-(--color-stone) mb-3">
            {oc.payment_instructions}
          </h2>
          {order.paidAt ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-600 text-green-700">
              {a.paid}
            </span>
          ) : (
            <div className="space-y-1.5 text-sm text-(--color-stone)">
              <p className="font-600">{oc.bank_transfer_title}</p>
              <p className="text-(--color-sand-dark) text-[12px] pt-1">
                {oc.bank_transfer_deadline}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Order items */}
      <div className="rounded-[14px] border border-(--color-border) bg-(--color-surface) overflow-hidden mb-4">
        <h2 className="font-heading text-[15px] font-700 text-(--color-stone) px-5 pt-5 mb-3">
          {oc.items_ordered}
        </h2>
        <ul className="divide-y divide-(--color-border)">
          {order.items.map((item) => {
            const snap = item.listingSnapshot;
            const cover = snap.cover_image;
            const productHref = snap.slug ? `/${lang}/shop/${snap.slug}` : null;
            return (
              <li key={item.id} className="px-5 py-4 flex items-start gap-3">
                {cover ? (
                  productHref ? (
                    <Link href={productHref} className="shrink-0 w-14 h-14 rounded-[10px] overflow-hidden border border-(--color-border) bg-(--color-background) block">
                      <Image src={cover.src} alt={cover.alt ?? snap.resolvedTitle} width={56} height={56} className="w-full h-full object-cover" />
                    </Link>
                  ) : (
                    <div className="shrink-0 w-14 h-14 rounded-[10px] overflow-hidden border border-(--color-border) bg-(--color-background)">
                      <Image src={cover.src} alt={cover.alt ?? snap.resolvedTitle} width={56} height={56} className="w-full h-full object-cover" />
                    </div>
                  )
                ) : (
                  <div className="shrink-0 w-14 h-14 rounded-[10px] bg-(--color-quartz-mist) border border-(--color-border) flex items-center justify-center">
                    <span className="text-[11px] font-700 text-(--color-cta) uppercase leading-none text-center px-1">
                      {snap.resolvedTitle.slice(0, 2)}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {productHref ? (
                    <Link href={productHref} className="text-sm font-600 text-(--color-stone) leading-tight truncate block hover:text-(--color-cta) transition-colors">
                      {snap.resolvedTitle}
                    </Link>
                  ) : (
                    <p className="text-sm font-600 text-(--color-stone) leading-tight truncate">
                      {snap.resolvedTitle}
                    </p>
                  )}
                  {snap.sku && (
                    <p className="text-[11px] text-(--color-sand-dark) mt-0.5">SKU: {snap.sku}</p>
                  )}
                  <p className="text-[12px] text-(--color-sand-dark) mt-1">
                    {item.quantity} × {fmt(item.unitPriceCents)}
                  </p>
                </div>

                <span className="text-sm font-700 text-(--color-stone) shrink-0">
                  {fmt(item.totalPriceCents)}
                </span>
              </li>
            );
          })}
        </ul>

        {/* Totals breakdown */}
        <div className="border-t border-(--color-border) px-5 py-4 space-y-2">
          <div className="flex justify-between text-sm text-(--color-sand-dark)">
            <span>{a.subtotal}</span>
            <span>{fmt(order.subtotalCents)}</span>
          </div>
          {order.discountCents > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>{a.discount_label}{order.couponCode ? ` (${order.couponCode})` : ''}</span>
              <span>−{fmt(order.discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-(--color-sand-dark)">
            <span>{a.shipping_fee}</span>
            <span>{fmt(order.shippingCents)}</span>
          </div>
          <div className="flex justify-between text-sm font-700 text-(--color-stone) pt-1 border-t border-(--color-border)">
            <span>{a.total}</span>
            <span className="text-(--color-cta)">{order.formattedTotal}</span>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      <div className="rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5">
        <h2 className="font-heading text-[15px] font-700 text-(--color-stone) mb-3">
          {oc.shipping_address}
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
        {a.order_date_label.replace('{date}', new Date(order.createdAt).toLocaleDateString(
          lang === 'vi' ? 'vi-VN' : 'en-US',
          { year: 'numeric', month: 'long', day: 'numeric' }
        ))}
      </p>
    </div>
  );
}
