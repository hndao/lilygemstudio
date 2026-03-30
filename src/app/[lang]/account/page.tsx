'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Package, MapPin, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDict } from '@/context/DictionaryContext';
import { getOrders } from '@/lib/commerceApi';
import type { Order } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-amber-50 text-amber-700 border border-amber-200',
  confirmed:  'bg-blue-50 text-blue-700 border border-blue-200',
  processing: 'bg-orange-50 text-orange-700 border border-orange-200',
  shipped:    'bg-sky-50 text-sky-700 border border-sky-200',
  delivered:  'bg-green-50 text-green-700 border border-green-200',
  cancelled:  'bg-red-50 text-red-600 border border-red-200',
};

export default function AccountPage() {
  const router = useRouter();
  const pathname = usePathname();
  const lang = pathname.split('/')[1] ?? 'en';
  const dict = useDict();
  const a = dict.account;
  const oc = dict.order_confirmation;

  const { customer, isLoading, logout } = useAuth();

  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !customer) router.replace(`/${lang}/auth`);
  }, [isLoading, customer, router, lang]);

  useEffect(() => {
    if (!customer) return;
    setOrdersLoading(true);
    getOrders(1)
      .then((res) => setRecentOrders(res.data.slice(0, 3)))
      .catch(() => setRecentOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [customer]);

  if (isLoading || !customer) return null;

  const statusLabels: Record<string, string> = {
    pending:    oc.status_pending,
    confirmed:  oc.status_confirmed,
    processing: oc.status_processing,
    shipped:    oc.status_shipped,
    delivered:  oc.status_delivered,
    cancelled:  oc.status_cancelled,
  };

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-[16px] bg-gradient-to-br from-(--color-quartz-mist) to-(--color-surface) border border-(--color-border) p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-(--color-cta) text-[20px] font-700 text-white uppercase shrink-0">
              {customer.name.charAt(0)}
            </div>
            <div>
              <p className="font-heading text-[18px] font-700 text-(--color-stone)">
                {a.welcome.replace('{name}', customer.name)}
              </p>
              <p className="text-[13px] text-(--color-sand-dark) mt-0.5">{customer.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="shrink-0 text-[12px] text-(--color-sand-dark) hover:text-red-500 transition-colors border border-(--color-border) rounded-[8px] px-3 py-1.5 hover:border-red-200 hover:bg-red-50"
          >
            {dict.header.sign_out}
          </button>
        </div>
      </div>

      {/* Quick-link cards */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/${lang}/account/orders`}
          className="rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5 flex flex-col gap-3 hover:border-(--color-cta) hover:shadow-sm transition-all group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-(--color-quartz-mist) text-(--color-cta) group-hover:bg-(--color-cta) group-hover:text-white transition-colors">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="font-heading text-[14px] font-700 text-(--color-stone)">{a.orders}</p>
            <p className="text-[12px] text-(--color-sand-dark) mt-0.5">{a.orders_hint}</p>
          </div>
        </Link>

        <Link
          href={`/${lang}/account/addresses`}
          className="rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5 flex flex-col gap-3 hover:border-(--color-cta) hover:shadow-sm transition-all group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-(--color-quartz-mist) text-(--color-cta) group-hover:bg-(--color-cta) group-hover:text-white transition-colors">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="font-heading text-[14px] font-700 text-(--color-stone)">{a.addresses}</p>
            <p className="text-[12px] text-(--color-sand-dark) mt-0.5">{a.addresses_hint}</p>
          </div>
        </Link>
      </div>

      {/* Recent orders */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-[15px] font-700 text-(--color-stone)">
            {a.recent_orders}
          </h2>
          <Link
            href={`/${lang}/account/orders`}
            className="text-[12px] text-(--color-cta) hover:text-(--color-cta-hover) transition-colors"
          >
            {a.view_all}
          </Link>
        </div>

        <div className="rounded-[16px] border border-(--color-border) bg-(--color-surface) overflow-hidden">
          {ordersLoading ? (
            <div className="px-5 py-2 animate-pulse space-y-0 divide-y divide-(--color-border)">
              {[0, 1, 2].map((i) => (
                <div key={i} className="py-4 flex items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-28 rounded-full bg-(--color-border)" />
                    <div className="h-3 w-20 rounded-full bg-(--color-border)" />
                  </div>
                  <div className="h-4 w-20 rounded-full bg-(--color-border)" />
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-(--color-quartz-mist) mx-auto mb-3">
                <Package className="h-6 w-6 text-(--color-cta)" strokeWidth={1.5} />
              </div>
              <p className="text-[13px] text-(--color-sand-dark) mb-4">{a.no_orders}</p>
              <Link
                href={`/${lang}/shop`}
                className="inline-flex items-center gap-1 rounded-[10px] bg-(--color-cta) px-5 py-2 text-[13px] font-600 text-white hover:bg-(--color-cta-hover) transition-colors"
              >
                {dict.home.shop_now} <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-(--color-border) px-5">
              {recentOrders.map((order) => (
                <li key={order.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <span className="text-[14px] font-700 text-(--color-stone)">#{order.orderNumber}</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-600 ${STATUS_COLORS[order.status] ?? 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                        {statusLabels[order.status] ?? order.status}
                      </span>
                      <span className="text-[11px] text-(--color-sand-dark)">
                        {new Date(order.createdAt).toLocaleDateString(
                          lang === 'vi' ? 'vi-VN' : 'en-US'
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[14px] font-700 text-(--color-cta)">{order.formattedTotal}</span>
                    <Link
                      href={`/${lang}/account/orders/${order.orderNumber}`}
                      className="flex h-8 items-center gap-1 rounded-[8px] border border-(--color-border) px-3 text-[12px] font-600 text-(--color-stone) hover:border-(--color-cta) hover:text-(--color-cta) transition-colors"
                    >
                      {a.view_details} <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
