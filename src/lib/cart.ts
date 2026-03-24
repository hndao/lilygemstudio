/**
 * cart.ts — localStorage-based cart utility for LilyGem Studio.
 *
 * WHY LOCALSTORAGE: Backend has no cart/order model yet. This provides
 * a working "Add to Cart" experience that persists across page navigations.
 * When the backend cart API is built, swap these functions to use fetch().
 *
 * STORAGE KEY: 'lilygem_cart' — namespaced to avoid collisions.
 *
 * DEDUPLICATION KEY: productId + colorSlug. Two cart entries with the same
 * product but different colors are treated as separate items.
 */

import type { Money } from '@/types';

const CART_KEY = 'lilygem_cart';

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  /** Selected color slug from ColorOption.slug — undefined for single-color or uncolored products */
  colorSlug?: string;
  quantity: number;
  price: Money;
  image: string;
}

/** Read cart from localStorage. Returns [] if empty or SSR. */
export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Persist cart to localStorage. */
function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: getCartCount() } }));
}

/** Deduplicate key: same product + same color (undefined treated as '') */
function itemKey(productId: string, colorSlug?: string): string {
  return `${productId}::${colorSlug ?? ''}`;
}

/**
 * Add an item. If same productId + colorSlug exists, increment quantity.
 * Otherwise append a new entry.
 */
export function addToCart(item: CartItem): void {
  const cart = getCart();
  const key = itemKey(item.productId, item.colorSlug);
  const idx = cart.findIndex((c) => itemKey(c.productId, c.colorSlug) === key);
  if (idx >= 0) {
    cart[idx].quantity += item.quantity;
  } else {
    cart.push(item);
  }
  saveCart(cart);
}

/** Remove a specific productId + colorSlug combination. */
export function removeFromCart(productId: string, colorSlug?: string): void {
  const key = itemKey(productId, colorSlug);
  const cart = getCart().filter((c) => itemKey(c.productId, c.colorSlug) !== key);
  saveCart(cart);
}

/** Update quantity for a specific item. Removes if qty <= 0. */
export function updateQuantity(productId: string, colorSlug: string | undefined, qty: number): void {
  if (qty <= 0) {
    removeFromCart(productId, colorSlug);
    return;
  }
  const key = itemKey(productId, colorSlug);
  const cart = getCart();
  const idx = cart.findIndex((c) => itemKey(c.productId, c.colorSlug) === key);
  if (idx >= 0) {
    cart[idx].quantity = qty;
    saveCart(cart);
  }
}

/** Total number of items in cart (sum of quantities). */
export function getCartCount(): number {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

/** Clear all items. */
export function clearCart(): void {
  saveCart([]);
}
