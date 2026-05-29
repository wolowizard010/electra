'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface CartItem {
  id: string;
  sku: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  maxStock: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | null>(null);

const GUEST_KEY = 'electra_cart_guest';
const userCartKey = (userId: string) => `electra_cart_${userId}`;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [storageKey, setStorageKey] = useState<string>(GUEST_KEY);

  // On mount: detect logged-in user, load correct cart, merge guest cart if needed
  useEffect(() => {
    try {
      const match = document.cookie.match(/electra_user=([^;]+)/);
      if (match) {
        const info = JSON.parse(decodeURIComponent(match[1]));
        if (info.id) {
          const key = userCartKey(info.id);

          // Load saved user cart
          const userCart: CartItem[] = JSON.parse(localStorage.getItem(key) || '[]');

          // Merge any guest items accumulated before login
          const guestCart: CartItem[] = JSON.parse(localStorage.getItem(GUEST_KEY) || '[]');
          if (guestCart.length > 0) {
            const merged = [...userCart];
            for (const guestItem of guestCart) {
              const existing = merged.find((i) => i.id === guestItem.id);
              if (existing) {
                existing.quantity = Math.min(existing.quantity + guestItem.quantity, existing.maxStock);
              } else {
                merged.push(guestItem);
              }
            }
            localStorage.removeItem(GUEST_KEY);
            localStorage.setItem(key, JSON.stringify(merged));
            setItems(merged);
          } else {
            setItems(userCart);
          }

          setStorageKey(key);
          return;
        }
      }
    } catch {}

    // Not logged in — load guest cart
    try {
      const guestCart = localStorage.getItem(GUEST_KEY);
      if (guestCart) setItems(JSON.parse(guestCart));
    } catch {}
    setStorageKey(GUEST_KEY);
  }, []);

  // Persist on every change
  useEffect(() => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: Math.min(i.quantity + 1, i.maxStock) }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantity: Math.min(qty, i.maxStock) } : i))
      );
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQty, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
