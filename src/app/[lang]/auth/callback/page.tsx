'use client';

/**
 * OAuth Callback Page — /[lang]/auth/callback
 *
 * Handles the fallback redirect flow for social OAuth when popups are blocked.
 * The backend redirects here with ?token=... after a successful OAuth exchange.
 * useSearchParams requires Suspense — inner component contains the logic.
 */

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { Customer } from '@/types';

function CallbackInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { setAuth }  = useAuth();

  useEffect(() => {
    const token  = searchParams.get('token');
    const raw    = searchParams.get('customer');
    const error  = searchParams.get('error');

    if (error) {
      router.replace('/');
      return;
    }

    if (token && raw) {
      try {
        const customer = JSON.parse(decodeURIComponent(raw)) as Customer;
        setAuth(token, customer);
        const returnTo = sessionStorage.getItem('auth_return_to') ?? '/';
        sessionStorage.removeItem('auth_return_to');
        router.replace(returnTo);
      } catch {
        router.replace('/');
      }
    }
  }, [searchParams, router, setAuth]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-sm text-(--color-muted)">Completing sign in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-(--color-muted)">Loading…</p>
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
