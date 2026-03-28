'use client';

/**
 * Order Confirmation — /[lang]/checkout/success?order=ORD-xxxxx
 *
 * Fetches the order by number and shows:
 *  - Animated success checkmark + order number
 *  - Order items with listing snapshots
 *  - Payment instructions (COD or Bank Transfer)
 *  - Shipping address summary
 *  - Track Order + Keep Shopping CTAs
 */

import { Suspense, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
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

// ── Price helpers ──────────────────────────────────────────────────────────

function fmtVnd(cents: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(cents);
}

// ── Payment Instructions — client for clipboard API ────────────────────────

function PaymentInstructions({ order }: { order: Order }) {
  const [copied, setCopied] = useState(false);

  // Detect payment method from notes field
  const isBank = order.notes?.toLowerCase().includes('bank') ||
    order.notes?.toLowerCase().includes('chuyển khoản');
  const isCod  = !isBank;

  if (isCod) {
    return (
      <div className="rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5">
        <div className="mb-3 flex items-center gap-2">
          <Package className="h-5 w-5 text-(--color-cta)" />
          <p className="font-heading text-[15px] font-700 text-(--color-stone)">
            Hướng dẫn thanh toán
          </p>
        </div>
        <p className="text-sm text-(--color-stone-light)">
          Thanh toán khi nhận hàng (COD). Vui lòng chuẩn bị đúng số tiền khi shipper giao hàng.
        </p>
        <div className="mt-3 rounded-[10px] bg-(--color-quartz-mist) px-4 py-3">
          <p className="text-center text-[22px] font-700 text-(--color-cta)">
            {fmtVnd(order.totalCents)}
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
          Thông tin chuyển khoản
        </p>
      </div>

      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between">
          <span className="text-(--color-stone-light)">Ngân hàng</span>
          <span className="font-600 text-(--color-stone)">{bankName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-(--color-stone-light)">Số tài khoản</span>
          <div className="flex items-center gap-2">
            <span className="font-700 text-(--color-stone)">{bankAccount}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-(--color-quartz-mist) transition-colors hover:bg-(--color-border)"
              aria-label="Sao chép số tài khoản"
            >
              {copied
                ? <Check className="h-3.5 w-3.5 text-green-600" />
                : <Copy className="h-3.5 w-3.5 text-(--color-stone-light)" />
              }
            </button>
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-(--color-stone-light)">Chủ tài khoản</span>
          <span className="font-600 text-(--color-stone)">{bankOwner}</span>
        </div>
        <div className="my-1 border-t border-(--color-border)" />
        <div className="flex justify-between">
          <span className="text-(--color-stone-light)">Nội dung CK</span>
          <span className="font-700 text-(--color-cta)">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-(--color-stone-light)">Số tiền</span>
          <span className="font-700 text-(--color-cta)">{fmtVnd(order.totalCents)}</span>
        </div>
      </div>

      <p className="mt-4 rounded-[8px] bg-amber-50 px-3 py-2 text-[12px] text-amber-700">
        Vui lòng chuyển khoản trong vòng 24 giờ. Đơn hàng sẽ được xử lý sau khi xác nhận thanh toán.
      </p>
    </div>
  );
}

// ── Order Status Timeline ─────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending:    'Chờ xác nhận',
  confirmed:  'Đã xác nhận',
  processing: 'Đang xử lý',
  shipped:    'Đã gửi hàng',
  delivered:  'Đã giao hàng',
  cancelled:  'Đã hủy',
};

const STATUS_ORDER = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

function StatusTimeline({ status, histories }: { status: string; histories: Order['statusHistories'] }) {
  const currentIdx = STATUS_ORDER.indexOf(status);

  return (
    <div className="rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5">
      <p className="mb-4 font-heading text-[15px] font-700 text-(--color-stone)">
        Trạng thái đơn hàng
      </p>
      <div className="relative">
        {/* Vertical line */}
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
                  isDone
                    ? 'border-(--color-cta) bg-(--color-cta)'
                    : 'border-(--color-border) bg-(--color-background)',
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
                      {new Date(history.createdAt).toLocaleString('vi-VN')}
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
  return (
    <div className={['animate-pulse rounded-[8px] bg-(--color-border)', className].join(' ')} />
  );
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

// ── Page ──────────────────────────────────────────────────────────────────

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const pathname     = usePathname();
  const lang         = pathname.split('/')[1] ?? 'vi';

  const orderNumber = searchParams.get('order');

  const [order, setOrder]     = useState<Order | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  // Guard against React Strict Mode double-invocation: the first effect run
  // consumes the sessionStorage entry; without this ref the second run would
  // fall through to the API and get a 404 for guest orders.
  const fetchStarted = useRef(false);

  useEffect(() => {
    if (fetchStarted.current) return;
    fetchStarted.current = true;

    if (!orderNumber) {
      setError('Không tìm thấy mã đơn hàng.');
      setLoading(false);
      return;
    }

    // 1. Try sessionStorage first (set immediately after checkout — works for guests too)
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('lily_last_order');
      if (cached) {
        try {
          const parsed: Order = JSON.parse(cached);
          if (parsed.orderNumber === orderNumber) {
            setOrder(parsed);
            sessionStorage.removeItem('lily_last_order'); // consume once
            setLoading(false);
            setTimeout(() => setVisible(true), 50);
            return;
          }
        } catch { /* invalid cache, fall through */ }
      }
    }

    // 2. Fall back to API (works for logged-in users re-visiting the page,
    //    and for guests — the show endpoint now allows guest orders by order number)
    getOrder(orderNumber)
      .then((o) => {
        setOrder(o);
        setTimeout(() => setVisible(true), 50);
      })
      .catch(() => setError('Không thể tải thông tin đơn hàng. Vui lòng kiểm tra email xác nhận.'))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) return <SuccessSkeleton />;

  if (error || !order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="mb-2 text-lg font-600 text-(--color-stone)">Có lỗi xảy ra</p>
        <p className="mb-6 text-sm text-(--color-stone-light)">{error}</p>
        <Link href={`/${lang}/shop`} className="text-sm font-600 text-(--color-cta) underline">
          Quay lại cửa hàng
        </Link>
      </div>
    );
  }

  const isVn         = order.shippingAddress.countryCode === 'VN';
  const shopHref     = `/${lang}/shop`;
  const zaloPhone    = '0123456789'; // Override via env if needed

  return (
    <main className="mx-auto max-w-lg px-4 py-10 pb-[max(40px,env(safe-area-inset-bottom))]">

      {/* ── Success header ─────────────────────────────────────────────── */}
      <div className={[
        'mb-8 flex flex-col items-center gap-3 text-center transition-all duration-700',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      ].join(' ')}>
        <div className="relative">
          {/* Glow ring */}
          <div className="absolute inset-0 animate-ping rounded-full bg-green-100 opacity-60" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-11 w-11 text-green-600" strokeWidth={1.5} />
          </div>
        </div>

        <div>
          <h1 className="font-heading text-2xl font-700 text-(--color-stone)">
            Đặt hàng thành công!
          </h1>
          <p className="mt-1 text-sm text-(--color-stone-light)">
            Mã đơn hàng: <span className="font-700 text-(--color-cta)">{order.orderNumber}</span>
          </p>
        </div>

        <p className="max-w-xs text-[13px] text-(--color-stone-light)">
          Chúng tôi sẽ xác nhận đơn hàng qua email trong vòng 24 giờ.
        </p>
      </div>

      {/* ── Order items ────────────────────────────────────────────────── */}
      <section className="mb-5 rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5">
        <p className="mb-4 font-heading text-[15px] font-700 text-(--color-stone)">
          Sản phẩm đặt hàng
        </p>
        <div className="space-y-3">
          {order.items.map((item) => {
            const snap  = item.listingSnapshot;
            const cover = snap.cover_image;
            const priceVnd = snap.price_cents_vnd ?? snap.price_cents;
            const productHref = snap.slug ? `/${lang}/shop/${snap.slug}` : null;

            return (
              <div key={item.id} className="flex items-center gap-3">
                {cover?.src ? (
                  productHref ? (
                    <Link href={productHref} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-(--color-quartz-mist) block">
                      <Image
                        src={cover.src}
                        alt={cover.alt || snap.resolvedTitle}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </Link>
                  ) : (
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-(--color-quartz-mist)">
                      <Image
                        src={cover.src}
                        alt={cover.alt || snap.resolvedTitle}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                  )
                ) : (
                  <div className="h-14 w-14 shrink-0 rounded-[10px] bg-(--color-quartz-mist) flex items-center justify-center">
                    <span className="text-[11px] font-700 text-(--color-cta) uppercase leading-none text-center px-1">
                      {snap.resolvedTitle.slice(0, 2)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {productHref ? (
                    <Link href={productHref} className="truncate text-sm font-600 text-(--color-stone) block hover:text-(--color-cta) transition-colors">
                      {snap.resolvedTitle}
                    </Link>
                  ) : (
                    <p className="truncate text-sm font-600 text-(--color-stone)">{snap.resolvedTitle}</p>
                  )}
                  {snap.sku && (
                    <p className="text-[11px] text-(--color-sand-dark)">SKU: {snap.sku}</p>
                  )}
                  <p className="text-[12px] text-(--color-stone-light)">
                    × {item.quantity}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-700 text-(--color-cta)">
                  {fmtVnd(item.totalPriceCents)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="mt-4 space-y-1.5 border-t border-(--color-border) pt-4">
          <div className="flex justify-between text-sm text-(--color-stone-light)">
            <span>Tạm tính</span>
            <span>{fmtVnd(order.subtotalCents)}</span>
          </div>
          {order.discountCents > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Giảm giá{order.couponCode ? ` (${order.couponCode})` : ''}</span>
              <span>−{fmtVnd(order.discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-(--color-stone-light)">
            <span>Vận chuyển</span>
            <span>{order.shippingCents === 0 ? 'Miễn phí' : fmtVnd(order.shippingCents)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-(--color-border) pt-2 text-[15px] font-700 text-(--color-stone)">
            <span>Tổng cộng</span>
            <span className="text-(--color-cta)">{fmtVnd(order.totalCents)}</span>
          </div>
        </div>
      </section>

      {/* ── Payment instructions (VN) ──────────────────────────────────── */}
      <div className="mb-5">
        <PaymentInstructions order={order} />
      </div>

      {/* ── Status timeline ────────────────────────────────────────────── */}
      <div className="mb-5">
        <StatusTimeline status={order.status} histories={order.statusHistories} />
      </div>

      {/* ── Shipping address ───────────────────────────────────────────── */}
      <section className="mb-8 rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5">
        <div className="mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-(--color-cta)" />
          <p className="font-heading text-[15px] font-700 text-(--color-stone)">
            Địa chỉ giao hàng
          </p>
        </div>
        <div className="space-y-0.5 text-sm text-(--color-stone-light)">
          <p className="font-600 text-(--color-stone)">{order.shippingAddress.recipientName}</p>
          {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
          <p>{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}</p>
          <p>{order.shippingAddress.city}{order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''} {order.shippingAddress.postalCode}</p>
          <p>{order.shippingAddress.countryCode}</p>
        </div>
      </section>

      {/* ── CTAs ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <Link
          href={`/${lang}/account/orders/${order.orderNumber}`}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-(--color-cta) text-sm font-700 text-white transition-all hover:bg-(--color-cta-hover)"
        >
          <Package className="h-4 w-4" />
          Theo dõi đơn hàng
        </Link>

        <Link
          href={shopHref}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-(--color-border) text-sm font-600 text-(--color-stone) transition-all hover:bg-(--color-quartz-mist)"
        >
          <ShoppingBag className="h-4 w-4" />
          Tiếp tục mua sắm
        </Link>

        {/* Zalo support */}
        <a
          href={`https://zalo.me/${zaloPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-[13px] text-(--color-stone-light) transition-colors hover:text-(--color-cta)"
        >
          <MessageCircle className="h-4 w-4 text-(--color-zalo)" />
          Cần hỗ trợ? Chat với chúng tôi qua Zalo
        </a>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-(--color-background)" />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
