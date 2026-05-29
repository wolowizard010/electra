'use client';

import { useCart } from '@/lib/cart-context';
import Link from 'next/link';
import { useEffect } from 'react';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
}

export default function CartDrawer({ open, onClose, isLoggedIn }: CartDrawerProps) {
  const { items, removeFromCart, updateQty, totalPrice, clearCart } = useCart();

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-slate-900 border-l border-white/5 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">Your Cart</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 gap-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm">Your cart is empty.<br />Browse the store to add items!</p>
              <button onClick={onClose}>
                <Link href="/shop" className="text-blue-400 hover:underline text-sm">Go to Shop →</Link>
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 bg-slate-800/50 rounded-xl p-4 border border-white/5">
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-slate-700" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white leading-tight line-clamp-2 mb-1">{item.name}</p>
                  <p className="text-blue-400 font-bold text-sm">₹{item.price.toLocaleString('en-IN')}</p>

                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-2 py-1">
                      <button
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        className="text-slate-400 hover:text-white w-5 h-5 flex items-center justify-center font-bold"
                      >−</button>
                      <span className="text-white text-sm w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.maxStock}
                        className="text-slate-400 hover:text-white w-5 h-5 flex items-center justify-center font-bold disabled:opacity-30"
                      >+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-rose-400 hover:text-rose-300 text-xs transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
                <div className="text-right text-sm font-bold text-white flex-shrink-0">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span className="text-white font-black text-xl">₹{totalPrice.toLocaleString('en-IN')}</span>
            </div>

            {isLoggedIn ? (
              <Link
                href="/checkout"
                onClick={onClose}
                className="block w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-center rounded-xl transition-colors"
              >
                Proceed to Checkout
              </Link>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 text-center">Sign in to complete your purchase</p>
                <Link
                  href="/login"
                  onClick={onClose}
                  className="block w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-center rounded-xl transition-colors"
                >
                  Sign In to Checkout
                </Link>
                <Link
                  href="/register"
                  onClick={onClose}
                  className="block w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold text-center rounded-xl transition-colors text-sm"
                >
                  Create an Account
                </Link>
              </div>
            )}

            <button
              onClick={clearCart}
              className="w-full text-xs text-slate-500 hover:text-rose-400 transition-colors py-1"
            >
              Clear cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
