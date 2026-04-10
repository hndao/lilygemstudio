/**
 * Auth helpers — customer authentication for LilyGemStudio.
 *
 * Token is stored in localStorage under 'lily_auth_token'.
 * All functions are SSR-safe (guarded by typeof window check).
 */

import type { Customer } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

const TOKEN_KEY    = 'lily_auth_token';
const CUSTOMER_KEY = 'lily_auth_customer';

// ── Token / customer storage ───────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_KEY);
}

export function getStoredCustomer(): Customer | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CUSTOMER_KEY);
    return raw ? (JSON.parse(raw) as Customer) : null;
  } catch {
    return null;
  }
}

export function setStoredCustomer(customer: Customer): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
}

// ── Internal fetcher ───────────────────────────────────────────────────────────

async function authFetch<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const { headers: extraHeaders, ...rest } = init ?? {};
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(extraHeaders as Record<string, string> ?? {}),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return data as T;
}

// ── Auth API calls ─────────────────────────────────────────────────────────────

export interface AuthResponse {
  customer: Customer;
  token: string;
}

export async function apiRegister(
  name: string,
  email: string,
  password: string,
  passwordConfirmation: string,
  turnstileToken: string,
): Promise<AuthResponse> {
  return authFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
      site: 'lilygemstudio',
      cf_turnstile_token: turnstileToken,
    }),
  });
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  return authFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function apiLogout(token: string): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });
}

export async function apiMe(token: string): Promise<{ customer: Customer }> {
  return authFetch<{ customer: Customer }>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/** Returns the URL to open in a popup window for social OAuth */
export function getSocialLoginUrl(provider: 'google' | 'facebook'): string {
  return `${API_BASE}/auth/social/${provider}?popup=1`;
}

// ── Authenticated listing actions ──────────────────────────────────────────────

export async function apiToggleLike(
  listingSlug: string,
  token: string,
): Promise<{ liked: boolean; count: number }> {
  return authFetch<{ liked: boolean; count: number }>(`/listings/${listingSlug}/like`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function apiGetLikeStatus(
  listingSlug: string,
  token: string,
): Promise<{ liked: boolean; count: number }> {
  return authFetch<{ liked: boolean; count: number }>(`/listings/${listingSlug}/like`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function apiSubmitReview(
  listingSlug: string,
  token: string,
  data: { rating: number; title: string; body: string; author_name?: string; order_id?: number | null },
): Promise<{ message: string }> {
  return authFetch<{ message: string }>(`/listings/${listingSlug}/reviews`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export interface ReviewEligibility {
  eligible: boolean;
  reason: 'already_reviewed' | 'no_delivered_order' | 'window_expired' | 'no_listing' | null;
  order_id: number | null;
  listing_id: number | null;
  days_remaining: number | null;
  min_chars: number;
  max_chars: number;
}

export async function apiGetReviewEligibility(
  listingSlug: string,
  token: string,
): Promise<ReviewEligibility> {
  return authFetch<ReviewEligibility>(`/listings/${listingSlug}/review-eligibility`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
