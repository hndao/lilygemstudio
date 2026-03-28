'use client';

/**
 * Account section layout — sidebar nav (desktop) + top nav (mobile).
 * Wraps all /account/* pages with consistent chrome.
 */

import { useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, MapPin, User, ChevronRight } from 'lucide-react';
import { AuthContext } from '@/context/AuthContext';

const NAV_ITEMS = [
  { href: '/account', label: 'Tổng quan', icon: User, exact: true },
  { href: '/account/orders', label: 'Đơn hàng', icon: Package, exact: false },
  { href: '/account/addresses', label: 'Địa chỉ', icon: MapPin, exact: false },
];

function AccountSidebar({ lang }: { lang: string }) {
  const pathname = usePathname();
  // Use context directly (not useAuth) — avoids throwing during SSR/hydration
  const auth = useContext(AuthContext);
  const customer = auth?.customer ?? null;
  const logout = auth?.logout;

  return (
    <aside className="hidden md:flex md:flex-col md:w-[220px] shrink-0">
      {/* Avatar + name */}
      {customer && (
        <div className="mb-6 flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-(--color-cta) text-[15px] font-700 text-white uppercase shrink-0">
              {customer.name?.charAt(0) ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-700 text-(--color-stone) truncate">{customer.name}</p>
              <p className="text-[11px] text-(--color-sand-dark) truncate">{customer.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const fullHref = `/${lang}${href}`;
          const active = exact ? pathname === fullHref : pathname.startsWith(fullHref);
          return (
            <Link
              key={href}
              href={fullHref}
              className={[
                'flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13px] font-600 transition-colors',
                active
                  ? 'bg-(--color-quartz-mist) text-(--color-cta)'
                  : 'text-(--color-stone) hover:bg-(--color-quartz-mist) hover:text-(--color-cta)',
              ].join(' ')}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {active && <ChevronRight className="h-3.5 w-3.5 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {logout && (
        <div className="mt-auto pt-6 border-t border-(--color-border)">
          <button
            onClick={() => { void logout(); }}
            className="w-full text-left text-[12px] text-(--color-sand-dark) hover:text-red-500 transition-colors px-3 py-1.5 rounded-[8px] hover:bg-red-50"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </aside>
  );
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lang = pathname.split('/')[1] ?? 'vi';

  return (
    <div className="min-h-[calc(100vh-64px)] bg-(--color-background)">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="flex gap-8 items-start">
          <AccountSidebar lang={lang} />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
