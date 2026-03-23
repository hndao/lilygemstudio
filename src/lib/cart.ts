/**
 * cart.ts — localStorage-based cart utility for LilyGem Studio.
 *
 * WHY LOCALSTORAGE: Backend has no cart/order model yet. This provides
 * a working "Add to Cart" experience that persists across page navigations.
 * When the backend cart API is built, swap these functions to use fetch().
 *
 * STORAGE KEY: 'lilygem_cart' — namespaced to avoid collisions.
 */

import type { Money } from '@/types';

const CART_KEY = 'lilygem_cart';

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  size: string;
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
  // Dispatch a custom event so other components (e.g. header cart badge) can react
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: getCartCount() } }));
}

/**
 * Add an item. If same productId + size exists, increment quantity.
 * Otherwise append a new entry.
 */
export function addToCart(item: CartItem): void {
  const cart = getCart();
  const idx = cart.findIndex((c) => c.productId === item.productId && c.size === item.size);
  if (idx >= 0) {
    cart[idx].quantity += item.quantity;
  } else {
    cart.push(item);
  }
  saveCart(cart);
}

/** Remove a specific productId + size combination. */
export function removeFromCart(productId: string, size: string): void {
  const cart = getCart().filter((c) => !(c.productId === productId && c.size === size));
  saveCart(cart);
}

/** Update quantity for a specific item. Removes if qty <= 0. */
export function updateQuantity(productId: string, size: string, qty: number): void {
  if (qty <= 0) {
    removeFromCart(productId, size);
    return;
  }
  const cart = getCart();
  const idx = cart.findIndex((c) => c.productId === productId && c.size === size);
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
