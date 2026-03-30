'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Copy,
  Check,
  Package,
  MapPin,
  ShoppingBag,
  MessageCircle,
} from 'lucide-react';
import { getOrder } from '@/lib/commerceApi';
import type { Order } from '@/types';
import type { Dictionary } from '@/lib/i18n';

type Dict = Dictionary['order_confirmation'];

// ── Price helpers ──────────────────────────────────────────────────────────

function fmtVnd(cents: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(cents);
}

function fmtUsd(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

// ── Payment Instructions ───────────────────────────────────────────────────

function PaymentInstructions({ order, isVn, dict }: { order: Order; isVn: boolean; dict: Dict }) {
  const [copied, setCopied] = useState(false);

  const isBank = order.notes?.toLowerCase().includes('bank') ||
    order.notes?.toLowerCase().includes('chuyển khoản');
  const isCod = !isBank;

  const fmt = isVn ? fmtVnd : fmtUsd;
  const totalCents = isVn ? order.totalCents : order.totalCents;

  if (isCod) {
    return (
      <div className="rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5">
        <div className="mb-3 flex items-center gap-2">
          <Package className="h-5 w-5 text-(--color-cta)" />
          <p className="font-heading text-[15px] font-700 text-(--color-stone)">
            {dict.payment_instructions}
          </p>
        </div>
        <p className="text-sm text-(--color-stone-light)">{dict.cod_instruction}</p>
        <div className="mt-3 rounded-[10px] bg-(--color-quartz-mist) px-4 py-3">
          <p className="text-center text-[22px] font-700 text-(--color-cta)">
            {fmt(totalCents)}
          </p>
        </div>
      </div>
    );
  }

  const bankAccount = process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? '0123456789';
  const bankName    = process.env.NEXT_PUBLIC_BANK_NAME    ?? 'MB Bank';
  const bankOwner   = process.env.NEXT_PUBLIC_BANK_OWNER   ?? 'LILY GEM STUDIO';

  function handleCopy() {
    navigator.clipboard.writeText(bankAccount).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5">
      <div className="mb-4 flex items-center gap-2">
        <Package className="h-5 w-5 text-(--color-cta)" />
        <p className="font-heading text-[15px] font-700 text-(--color-stone)">
          {dict.bank_transfer_title}
        </p>
      </div>
      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between">
          <span className="text-(--color-stone-light)">{dict.bank_name_label}</span>
          <span className="font-600 text-(--color-stone)">{bankName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-(--color-stone-light)">{dict.bank_account_label}</span>
          <div className="flex items-center gap-2">
            <span className="font-700 text-(--color-stone)">{bankAccount}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-(--color-quartz-mist) transition-colors hover:bg-(--color-border)"
              aria-label={dict.copy_account_aria}
            >
              {copied
                ? <Check className="h-3.5 w-3.5 text-green-600" />
                : <Copy className="h-3.5 w-3.5 text-(--color-stone-light)" />
              }
            </button>
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-(--color-stone-light)">{dict.bank_owner_label}</span>
          <span className="font-600 text-(--color-stone)">{bankOwner}</span>
        </div>
        <div className="my-1 border-t border-(--color-border)" />
        <div className="flex justify-between">
          <span className="text-(--color-stone-light)">{dict.transfer_ref_label}</span>
          <span className="font-700 text-(--color-cta)">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-(--color-stone-light)">{dict.amount_label}</span>
          <span className="font-700 text-(--color-cta)">{fmt(totalCents)}</span>
        </div>
      </div>
      <p className="mt-4 rounded-[8px] bg-amber-50 px-3 py-2 text-[12px] text-amber-700">
        {dict.bank_transfer_deadline}
      </p>
    </div>
  );
}

// ── Status Timeline ────────────────────────────────────────────────────────

function StatusTimeline({
  status,
  histories,
  dict,
}: {
  status: string;
  histories: Order['statusHistories'];
  dict: Dict;
}) {
  const STATUS_LABELS: Record<string, string> = {
    pending:    dict.status_pending,
    confirmed:  dict.status_confirmed,
    processing: dict.status_processing,
    shipped:    dict.status_shipped,
    delivered:  dict.status_delivered,
    cancelled:  dict.status_cancelled,
  };

  const STATUS_ORDER = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentIdx = STATUS_ORDER.indexOf(status);

  return (
    <div className="rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5">
      <p className="mb-4 font-heading text-[15px] font-700 text-(--color-stone)">
        {dict.order_status}
      </p>
      <div className="relative">
        <div className="absolute left-[11px] top-3 h-[calc(100%-12px)] w-px bg-(--color-border)" />
        <div className="space-y-4">
          {STATUS_ORDER.map((s, i) => {
            const isDone    = i <= currentIdx;
            const isCurrent = i === currentIdx;
            const history   = histories.find((h) => h.status === s);
            return (
              <div key={s} className="relative flex gap-4">
                <div className={[
                  'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  isDone ? 'border-(--color-cta) bg-(--color-cta)' : 'border-(--color-border) bg-(--color-background)',
                ].join(' ')}>
                  {isDone && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="flex-1 pb-1 pt-0.5">
                  <p className={[
                    'text-sm font-500',
                    isCurrent ? 'font-700 text-(--color-stone)' : isDone ? 'text-(--color-stone)' : 'text-(--color-sand-dark)',
                  ].join(' ')}>
                    {STATUS_LABELS[s] ?? s}
                  </p>
                  {history?.createdAt && (
                    <p className="mt-0.5 text-[11px] text-(--color-sand-dark)">
                      {new Date(history.createdAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={['animate-pulse rounded-[8px] bg-(--color-border)', className].join(' ')} />;
}

function SuccessSkeleton() {
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-12">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-36" />
      </div>
      <Skeleton className="h-40" />
      <Skeleton className="h-32" />
    </div>
  );
}

// ── Main content ──────────────────────────────────────────────────────────

interface Props {
  lang: string;
  isVn: boolean;
  dict: Dict;
}

export function CheckoutSuccessContent({ lang, isVn, dict }: Props) {
  const searchParams = useSearchParams();
  const orderNumber  = searchParams.get('order');

  const [order, setOrder]     = useState<Order | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const fetchStarted = useRef(false);

  const fmt      = isVn ? fmtVnd : fmtUsd;
  const shopHref = `/${lang}/shop`;

  useEffect(() => {
    if (fetchStarted.current) return;
    fetchStarted.current = true;

    if (!orderNumber) {
      setError(dict.error_not_found);
      setLoading(false);
      return;
    }

    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('lily_last_order');
      if (cached) {
        try {
          const parsed: Order = JSON.parse(cached);
          if (parsed.orderNumber === orderNumber) {
            setOrder(parsed);
            sessionStorage.removeItem('lily_last_order');
            setLoading(false);
            setTimeout(() => setVisible(true), 50);
            return;
          }
        } catch { /* fall through */ }
      }
    }

    getOrder(orderNumber)
      .then((o) => { setOrder(o); setTimeout(() => setVisible(true), 50); })
      .catch(() => setError(dict.error_load))
      .finally(() => setLoading(false));
  }, [orderNumber, dict]);

  if (loading) return <SuccessSkeleton />;

  if (error || !order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="mb-2 text-lg font-600 text-(--color-stone)">{dict.error_title}</p>
        <p className="mb-6 text-sm text-(--color-stone-light)">{error}</p>
        <Link href={shopHref} className="text-sm font-600 text-(--color-cta) underline">
          {dict.error_back}
        </Link>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10 pb-[max(40px,env(safe-area-inset-bottom))]">

      {/* Success header */}
      <div className={[
        'mb-8 flex flex-col items-center gap-3 text-center transition-all duration-700',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      ].join(' ')}>
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-green-100 opacity-60" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-11 w-11 text-green-600" strokeWidth={1.5} />
          </div>
        </div>
        <div>
          <h1 className="font-heading text-2xl font-700 text-(--color-stone)">{dict.title}</h1>
          <p className="mt-1 text-sm text-(--color-stone-light)">
            {dict.order_number}<span className="font-700 text-(--color-cta)">{order.orderNumber}</span>
          </p>
        </div>
        <p className="max-w-xs text-[13px] text-(--color-stone-light)">{dict.confirmation_note}</p>
      </div>

      {/* Order items */}
      <section className="mb-5 rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5">
        <p className="mb-4 font-heading text-[15px] font-700 text-(--color-stone)">{dict.items_ordered}</p>
        <div className="space-y-3">
          {order.items.map((item) => {
            const snap        = item.listingSnapshot;
            const cover       = snap.cover_image;
            const priceCents  = isVn ? (snap.price_cents_vnd ?? snap.price_cents) : snap.price_cents;
            const productHref = snap.slug ? `/${lang}/shop/${snap.slug}` : null;

            return (
              <div key={item.id} className="flex items-center gap-3">
                {cover?.src ? (
                  productHref ? (
                    <Link href={productHref} className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-(--color-quartz-mist)">
                      <Image src={cover.src} alt={cover.alt || snap.resolvedTitle} fill sizes="56px" className="object-cover" />
                    </Link>
                  ) : (
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-(--color-quartz-mist)">
                      <Image src={cover.src} alt={cover.alt || snap.resolvedTitle} fill sizes="56px" className="object-cover" />
                    </div>
                  )
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] bg-(--color-quartz-mist)">
                    <span className="px-1 text-center text-[11px] font-700 leading-none text-(--color-cta) uppercase">
                      {snap.resolvedTitle.slice(0, 2)}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {productHref ? (
                    <Link href={productHref} className="block truncate text-sm font-600 text-(--color-stone) transition-colors hover:text-(--color-cta)">
                      {snap.resolvedTitle}
                    </Link>
                  ) : (
                    <p className="truncate text-sm font-600 text-(--color-stone)">{snap.resolvedTitle}</p>
                  )}
                  {snap.sku && <p className="text-[11px] text-(--color-sand-dark)">SKU: {snap.sku}</p>}
                  <p className="text-[12px] text-(--color-stone-light)">× {item.quantity}</p>
                </div>
                <p className="shrink-0 text-sm font-700 text-(--color-cta)">
                  {fmt(isVn ? item.totalPriceCents : item.totalPriceCents)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="mt-4 space-y-1.5 border-t border-(--color-border) pt-4">
          <div className="flex justify-between text-sm text-(--color-stone-light)">
            <span>{dict.subtotal}</span>
            <span>{fmt(order.subtotalCents)}</span>
          </div>
          {order.discountCents > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>{dict.discount}{order.couponCode ? ` (${order.couponCode})` : ''}</span>
              <span>−{fmt(order.discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-(--color-stone-light)">
            <span>{dict.shipping}</span>
            <span>{order.shippingCents === 0 ? dict.free : fmt(order.shippingCents)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-(--color-border) pt-2 text-[15px] font-700 text-(--color-stone)">
            <span>{dict.total}</span>
            <span className="text-(--color-cta)">{fmt(order.totalCents)}</span>
          </div>
        </div>
      </section>

      {/* Payment instructions */}
      <div className="mb-5">
        <PaymentInstructions order={order} isVn={isVn} dict={dict} />
      </div>

      {/* Status timeline */}
      <div className="mb-5">
        <StatusTimeline status={order.status} histories={order.statusHistories} dict={dict} />
      </div>

      {/* Shipping address */}
      <section className="mb-8 rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5">
        <div className="mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-(--color-cta)" />
          <p className="font-heading text-[15px] font-700 text-(--color-stone)">{dict.shipping_address}</p>
        </div>
        <div className="space-y-0.5 text-sm text-(--color-stone-light)">
          <p className="font-600 text-(--color-stone)">{order.shippingAddress.recipientName}</p>
          {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
          <p>{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}</p>
          <p>{order.shippingAddress.city}{order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''} {order.shippingAddress.postalCode}</p>
          <p>{order.shippingAddress.countryCode}</p>
        </div>
      </section>

      {/* CTAs */}
      <div className="flex flex-col gap-3">
        <Link
          href={`/${lang}/account/orders/${order.orderNumber}`}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-(--color-cta) text-sm font-700 text-white transition-all hover:bg-(--color-cta-hover)"
        >
          <Package className="h-4 w-4" />
          {dict.track_order}
        </Link>
        <Link
          href={shopHref}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-(--color-border) text-sm font-600 text-(--color-stone) transition-all hover:bg-(--color-quartz-mist)"
        >
          <ShoppingBag className="h-4 w-4" />
          {dict.keep_shopping}
        </Link>
        <a
          href="https://zalo.me/0123456789"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-[13px] text-(--color-stone-light) transition-colors hover:text-(--color-cta)"
        >
          <MessageCircle className="h-4 w-4 text-(--color-zalo)" />
          {dict.zalo_support}
        </a>
      </div>
    </main>
  );
}
