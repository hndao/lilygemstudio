/**
 * LilyGemStudio — Commerce API Client
 *
 * Handles all authenticated + cart-aware API calls: cart management, checkout,
 * orders, addresses, and listing lookups. Runs client-side only.
 *
 * TWO SPECIAL HEADERS:
 *  - Authorization: Bearer {token}  — from localStorage; customer identity
 *  - X-Cart-Token: {uuid}           — guest cart persistence; auto-generated on first add
 */

import type {
  Cart,
  CartItem,
  Address,
  AddressInput,
  ShippingRate,
  Order,
  PaginatedResponse,
  ListingCard,
  CheckoutPayload,
} from '@/types';

const API_BASE   = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';
const TOKEN_KEY  = 'lily_auth_token';
const CART_TOKEN_KEY = 'lily_cart_token';

// ── Storage helpers ────────────────────────────────────────────────────────────

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

function getCartToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CART_TOKEN_KEY);
}

/** Returns existing cart token or generates + persists a new UUID. */
function getOrCreateCartToken(): string {
  if (typeof window === 'undefined') return '';
  let token = localStorage.getItem(CART_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(CART_TOKEN_KEY, token);
  }
  return token;
}

// ── Internal fetcher ───────────────────────────────────────────────────────────

interface CommerceRequestInit {
  method?: string;
  body?: unknown;
  /** Force cart token generation even if cart doesn't exist yet (first add). */
  ensureCartToken?: boolean;
}

async function commerceFetch<T>(
  endpoint: string,
  opts: CommerceRequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const cartToken = opts.ensureCartToken ? getOrCreateCartToken() : getCartToken();
  if (cartToken) headers['X-Cart-Token'] = cartToken;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: opts.method ?? 'GET',
    headers,
    ...(opts.body !== undefined && { body: JSON.stringify(opts.body) }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      (data as { message?: string }).message ?? `HTTP ${res.status}: ${endpoint}`,
    );
  }
  return data as T;
}

// ── Cart ───────────────────────────────────────────────────────────────────────

/** Fetch the current cart (returns null when no token and no cart exists). */
export async function getCart(): Promise<Cart | null> {
  if (!getAuthToken() && !getCartToken()) return null;
  try {
    const res = await commerceFetch<{ data: Cart }>('/cart');
    return res.data;
  } catch {
    return null;
  }
}

export async function addCartItem(listingId: number, quantity = 1): Promise<Cart> {
  const res = await commerceFetch<{ data: Cart }>('/cart/items', {
    method: 'POST',
    body: { listing_id: listingId, quantity },
    ensureCartToken: true,
  });
  return res.data;
}

export async function updateCartItem(itemId: number, quantity: number): Promise<Cart> {
  const res = await commerceFetch<{ data: Cart }>(`/cart/items/${itemId}`, {
    method: 'PATCH',
    body: { quantity },
  });
  return res.data;
}

export async function removeCartItem(itemId: number): Promise<Cart> {
  const res = await commerceFetch<{ data: Cart }>(`/cart/items/${itemId}`, {
    method: 'DELETE',
  });
  return res.data;
}

export async function applyCoupon(code: string): Promise<Cart> {
  const res = await commerceFetch<{ data: Cart }>('/cart/coupon', {
    method: 'POST',
    body: { code },
  });
  return res.data;
}

export async function removeCoupon(): Promise<Cart> {
  const res = await commerceFetch<{ data: Cart }>('/cart/coupon', {
    method: 'DELETE',
  });
  return res.data;
}

// ── Shipping ───────────────────────────────────────────────────────────────────

export async function calculateShipping(
  countryCode: string,
  subtotalCents: number,
): Promise<ShippingRate[]> {
  const qs = new URLSearchParams({
    country_code: countryCode,
    subtotal_cents: String(subtotalCents),
  });
  const res = await commerceFetch<{ data: ShippingRate[] }>(`/shipping/rates?${qs}`);
  return res.data;
}

// ── Checkout ───────────────────────────────────────────────────────────────────

export async function checkout(payload: CheckoutPayload): Promise<Order> {
  const res = await commerceFetch<{ data: Order }>('/orders/checkout', {
    method: 'POST',
    body: payload,
  });
  return res.data;
}

// ── Orders ─────────────────────────────────────────────────────────────────────

export async function getOrders(page = 1): Promise<PaginatedResponse<Order>> {
  return commerceFetch<PaginatedResponse<Order>>(`/orders?page=${page}`);
}

export async function getOrder(orderNumber: string): Promise<Order> {
  const res = await commerceFetch<{ data: Order }>(`/orders/${orderNumber}`);
  return res.data;
}

// ── Addresses ──────────────────────────────────────────────────────────────────

export async function getAddresses(): Promise<Address[]> {
  const res = await commerceFetch<{ data: Address[] }>('/addresses');
  return res.data;
}

export async function createAddress(data: AddressInput): Promise<Address> {
  const res = await commerceFetch<{ data: Address }>('/addresses', {
    method: 'POST',
    body: data,
  });
  return res.data;
}

export async function updateAddress(id: number, data: AddressInput): Promise<Address> {
  const res = await commerceFetch<{ data: Address }>(`/addresses/${id}`, {
    method: 'PUT',
    body: data,
  });
  return res.data;
}

export async function deleteAddress(id: number): Promise<void> {
  await commerceFetch<void>(`/addresses/${id}`, { method: 'DELETE' });
}

export async function setDefaultAddress(id: number): Promise<Address> {
  const res = await commerceFetch<{ data: Address }>(`/addresses/${id}/default`, {
    method: 'POST',
  });
  return res.data;
}

// ── Listings ───────────────────────────────────────────────────────────────────

/** Fetch all live listings for a product slug — used on product detail pages. */
export async function getProductListings(slug: string): Promise<ListingCard[]> {
  const res = await fetch(
    `${API_BASE}/products/${encodeURIComponent(slug)}/listings`,
    {
      headers: { Accept: 'application/json' },
      next: { revalidate: 300, tags: [`product:${slug}`, 'listings:lilygemstudio'] },
    },
  );
  if (!res.ok) return [];
  const data = await res.json() as { data: ListingCard[] };
  return data.data ?? [];
}
