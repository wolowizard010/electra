'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/lib/cart-context';
import CartDrawer from './cart-drawer';

interface UserInfo {
  id: string;
  role: string;
  firstName: string;
}

export default function Navbar() {
  const { totalItems } = useCart();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const match = document.cookie.match(/electra_user=([^;]+)/);
      if (match) {
        const raw = decodeURIComponent(match[1]);
        const info = JSON.parse(raw);
        setUser(info);
      }
    } catch {}
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isStaff = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE_OPERATOR';

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    document.cookie = 'electra_user=; Max-Age=0; path=/';
    document.cookie = 'token=; Max-Age=0; path=/';
    window.location.href = '/';
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-md bg-slate-950/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* Logo */}
          <Link href={user ? '/shop' : '/'} className="text-xl font-black tracking-widest bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            ELECTRA
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-6 text-sm">

            {/* 1. Avatar dropdown (logged in) or Sign In / Register */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                {/* Trigger chip */}
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-2.5 bg-slate-800/80 border border-white/10 rounded-full pl-1 pr-3 py-1 hover:border-white/20 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                    {user.firstName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-slate-200">{user.firstName}</span>
                  {/* Chevron */}
                  <svg
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown panel */}
                {dropdownOpen && (
                  <div className="absolute left-0 mt-2 w-52 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-xs font-bold text-white">{user.firstName}</p>
                      <p className="text-xs text-slate-500 capitalize">{user.role.replace('_', ' ').toLowerCase()}</p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1.5">
                      <Link
                        href="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        My Profile
                      </Link>

                      {isStaff && (
                        <Link
                          href="/warehouse/orders"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-400 hover:bg-white/5 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Warehouse Portal
                        </Link>
                      )}

                      <div className="border-t border-white/5 mt-1.5 pt-1.5">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="text-slate-400 hover:text-white transition-colors">Sign In</Link>
                <Link href="/register" className="text-slate-400 hover:text-white transition-colors">Register</Link>
              </>
            )}

            {/* 2. Cart */}
            <button
              id="cart-toggle-btn"
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Cart
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} isLoggedIn={!!user} />
    </>
  );
}
