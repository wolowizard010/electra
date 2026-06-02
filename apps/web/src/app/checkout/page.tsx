'use client';

import { useCart } from '@/lib/cart-context';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface UserInfo { role: string; firstName: string; }

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
];

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loading, setLoading] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressPrefilled, setAddressPrefilled] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    postalCode: '',
  });

  // Read session cookie & fetch profile to pre-fill address
  useEffect(() => {
    try {
      const match = document.cookie.match(/electra_user=([^;]+)/);
      if (match) {
        const info = JSON.parse(decodeURIComponent(match[1]));
        setUser(info);
      }
    } catch {}

    fetch('/api/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        // Pre-fill name
        const fullName = `${data.firstName} ${data.lastName}`.trim();
        // Pre-fill address if one is saved
        if (data.address) {
          setForm({
            fullName,
            phone: data.address.phone || '',
            street1: data.address.street1 || '',
            street2: data.address.street2 || '',
            city: data.address.city || '',
            state: data.address.state || '',
            postalCode: data.address.postalCode || '',
          });
          setAddressPrefilled(true);
        } else {
          setForm((prev) => ({ ...prev, fullName }));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (!form.fullName || !form.street1 || !form.city || !form.state || !form.postalCode) {
      setError('Please fill in all required shipping address fields.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Save Address
      const addressRes = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.fullName.split(' ')[0] || '',
          lastName: form.fullName.split(' ').slice(1).join(' ') || '',
          address: {
            street1: form.street1,
            street2: form.street2,
            city: form.city,
            state: form.state,
            postalCode: form.postalCode,
            phone: form.phone,
          }
        })
      });
      const addressData = await addressRes.json();
      if (!addressData.addressId) throw new Error('Failed to save shipping address');

      // 1.5 Sync Cart
      const syncRes = await fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map(i => ({ id: i.id, quantity: i.quantity })) })
      });
      if (!syncRes.ok) throw new Error('Failed to sync cart to server');

      // 2. Initiate Checkout
      const initRes = await fetch('/api/orders/checkout/initiate', { method: 'POST' });
      const initData = await initRes.json();
      if (!initRes.ok) throw new Error(initData.error || 'Failed to initiate checkout');

      // Simulate payment delay
      await new Promise((r) => setTimeout(r, 1200));

      // 3. Confirm Checkout with Mock Payment
      const confirmRes = await fetch('/api/orders/checkout/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpayOrderId: initData.checkoutSession.razorpayOrderId,
          razorpayPaymentId: 'pay_mock_' + Date.now(),
          razorpaySignature: 'mock_valid_signature_2026',
          shippingAddressId: addressData.addressId
        })
      });
      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(confirmData.error || 'Failed to confirm checkout');

      clearCart();
      setPlaced(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Not logged in
  if (!loadingProfile && !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-black text-white mb-2">Sign In Required</h1>
          <p className="text-slate-400 mb-6">You need to be signed in to checkout.</p>
          <Link href="/login?redirect=/checkout" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors">Sign In</Link>
        </div>
      </div>
    );
  }

  // Empty cart
  if (items.length === 0 && !placed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🛒</div>
          <h1 className="text-2xl font-black text-white mb-2">Your cart is empty</h1>
          <p className="text-slate-400 mb-6">Add some products before checking out.</p>
          <Link href="/shop" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors">Browse Store</Link>
        </div>
      </div>
    );
  }

  // Success
  if (placed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Order Placed!</h1>
          <p className="text-slate-400 mb-2">Thank you, <span className="text-white font-semibold">{user?.firstName}</span>! Your order has been received.</p>
          <p className="text-slate-500 text-sm mb-8">You'll receive a confirmation email shortly. Our team will dispatch your items within 24 hours.</p>
          <Link href="/shop" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  const shipping = totalPrice >= 999 ? 0 : 99;
  const tax = totalPrice - (totalPrice / 1.18);
  const grandTotal = totalPrice + shipping;

  return (
    <div className="min-h-screen text-slate-100 py-10">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="text-3xl font-black text-white mb-8">Checkout</h1>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* Left — shipping form */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-black">1</span>
                    Shipping Address
                  </h2>
                  {addressPrefilled && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      Filled from your profile
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
                      <input name="fullName" required value={form.fullName} onChange={handleChange} placeholder="Rahul Verma"
                        className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Phone</label>
                      <input name="phone" required value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" type="tel"
                        className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Address Line 1</label>
                    <input name="street1" required value={form.street1} onChange={handleChange} placeholder="House / Flat No., Building Name, Street"
                      className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Address Line 2 <span className="text-slate-600 normal-case font-normal">(optional)</span>
                    </label>
                    <input name="street2" value={form.street2} onChange={handleChange} placeholder="Landmark, Area"
                      className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition" />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">City</label>
                      <input name="city" required value={form.city} onChange={handleChange} placeholder="Bengaluru"
                        className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">State</label>
                      <select name="state" required value={form.state} onChange={handleChange}
                        className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition">
                        <option value="">Select</option>
                        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">PIN Code</label>
                      <input name="postalCode" required value={form.postalCode} onChange={handleChange} placeholder="560001" maxLength={6} pattern="[0-9]{6}"
                        className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition" />
                    </div>
                  </div>

                  {!addressPrefilled && (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Save your address in{' '}
                      <Link href="/profile" className="text-blue-400 hover:underline">My Profile</Link>
                      {' '}to auto-fill next time.
                    </p>
                  )}
                </div>
              </div>

              {/* Payment */}
              <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-black">2</span>
                  Payment
                </h2>
                <div className="flex items-center gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                  <svg className="w-8 h-8 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-white">Razorpay</p>
                    <p className="text-xs text-slate-400">UPI, Cards, Net Banking, Wallets — pay securely after placing order</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — order summary */}
            <div className="lg:col-span-2">
              <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 sticky top-24">
                <h2 className="text-base font-bold text-white mb-5">Order Summary</h2>

                <div className="space-y-3 mb-5">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 items-center">
                      {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-slate-800 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 font-medium leading-snug line-clamp-2">{item.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold text-white flex-shrink-0">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/5 pt-4 space-y-2.5 text-sm">
                  <div className="flex justify-between text-slate-400"><span>Subtotal</span><span className="text-white">₹{totalPrice.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between text-slate-400">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? 'text-emerald-400 font-semibold' : 'text-white'}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                  </div>
                  <div className="border-t border-white/5 pt-3 flex justify-between items-center">
                    <span className="font-bold text-white">Total</span>
                    <span className="text-xl font-black text-blue-400">₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {shipping === 0 && (
                  <p className="text-xs text-emerald-400 mt-3 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    You qualify for free shipping!
                  </p>
                )}

                {error && <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">{error}</div>}

                <button type="submit" disabled={loading}
                  className="mt-5 w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm">
                  {loading ? 'Placing Order…' : `Place Order — ₹${grandTotal.toLocaleString('en-IN')}`}
                </button>
                <p className="text-xs text-slate-500 text-center mt-3">🔒 Secure checkout · 30-day returns</p>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}
