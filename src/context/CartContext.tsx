'use client';

/**
 * CartContext — API-backed cart state for LilyGemStudio.
 *
 * Replaces the localStorage-only cart for all buy actions.
 * CartProvider must wrap the root layout so every component can call useCart().
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useOptimistic,
  useRef,
  useState,
} from 'react';
import type { Cart } from '@/types';
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  applyCoupon,
  removeCoupon,
} from '@/lib/commerceApi';

// ── Context shape ──────────────────────────────────────────────────────────────

export interface CartContextValue {
  cart: Cart | null;
  isLoading: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (listingId: number, quantity?: number, selectedOptions?: Record<string, string>) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  applyCouponCode: (code: string) => Promise<void>;
  removeCouponCode: () => Promise<void>;
  /** Reset cart state after checkout (backend deletes cart on order creation). */
  clearCart: () => void;
  /** Derived — sum of item.quantity values. Optimistically updated. */
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart]       = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen]   = useState(false);
  // Optimistic badge count so UI responds before API returns
  const [optimisticCount, setOptimisticCount] = useState(0);
  const initRef = useRef(false);

  // ── Boot: fetch cart once on mount ──────────────────────────────────────────
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    setIsLoading(true);
    getCart()
      .then((c) => { setCart(c); setOptimisticCount(c?.itemCount ?? 0); })
      .finally(() => setIsLoading(false));
  }, []);

  const itemCount = optimisticCount;

  // ── Actions ─────────────────────────────────────────────────────────────────

  const openCart  = useCallback(() => setIsOpen(true),  []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback(async (listingId: number, quantity = 1, selectedOptions?: Record<string, string>) => {
    // Optimistic badge increment — feels instant
    setOptimisticCount((n) => n + quantity);
    try {
      const updated = await addCartItem(listingId, quantity, selectedOptions);
      setCart(updated);
      setOptimisticCount(updated.itemCount);
      setIsOpen(true);
    } catch (err) {
      // Roll back optimistic count
      setOptimisticCount((n) => Math.max(0, n - quantity));
      throw err;
    }
  }, []);

  const updateItem = useCallback(async (itemId: number, quantity: number) => {
    try {
      const updated = await updateCartItem(itemId, quantity);
      setCart(updated);
      setOptimisticCount(updated.itemCount);
    } catch (err) {
      throw err;
    }
  }, []);

  const removeItem = useCallback(async (itemId: number) => {
    // Optimistic: subtract the item's quantity before API returns
    const item = cart?.items.find((i) => i.id === itemId);
    if (item) setOptimisticCount((n) => Math.max(0, n - item.quantity));
    try {
      const updated = await removeCartItem(itemId);
      setCart(updated);
      setOptimisticCount(updated.itemCount);
    } catch (err) {
      // Roll back
      if (item) setOptimisticCount((n) => n + item.quantity);
      throw err;
    }
  }, [cart]);

  const applyCouponCode = useCallback(async (code: string) => {
    const updated = await applyCoupon(code);
    setCart(updated);
    setOptimisticCount(updated.itemCount);
  }, []);

  const removeCouponCode = useCallback(async () => {
    const updated = await removeCoupon();
    setCart(updated);
    setOptimisticCount(updated.itemCount);
  }, []);

  const clearCart = useCallback(() => {
    setCart(null);
    setOptimisticCount(0);
    setIsOpen(false);
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isOpen,
        openCart,
        closeCart,
        addItem,
        updateItem,
        removeItem,
        applyCouponCode,
        removeCouponCode,
        clearCart,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
