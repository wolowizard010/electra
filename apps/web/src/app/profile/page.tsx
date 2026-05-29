'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
];

interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  address: {
    label: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
  } | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [label, setLabel] = useState('Home');
  const [street1, setStreet1] = useState('');
  const [street2, setStreet2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => {
        if (r.status === 401) { window.location.href = '/login'; return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setProfile(data);
        setFirstName(data.firstName);
        setLastName(data.lastName);
        if (data.address) {
          setLabel(data.address.label || 'Home');
          setStreet1(data.address.street1 || '');
          setStreet2(data.address.street2 || '');
          setCity(data.address.city || '');
          setState(data.address.state || '');
          setPostalCode(data.address.postalCode || '');
          setPhone(data.address.phone || '');
        }
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          address: street1 ? { label, street1, street2, city, state, postalCode, phone } : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed.');

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100 py-10">
      <div className="max-w-2xl mx-auto px-6">

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black flex-shrink-0">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{firstName} {lastName}</h1>
            <p className="text-slate-400 text-sm">{profile?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">

          {/* Personal info */}
          <section className="bg-slate-900/60 border border-white/5 rounded-2xl p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-5">Personal Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">First Name</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Last Name</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email</label>
              <input
                value={profile?.email ?? ''}
                disabled
                className="w-full bg-slate-950/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
          </section>

          {/* Default address */}
          <section className="bg-slate-900/60 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Default Address</h2>
              <select
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition"
              >
                <option>Home</option>
                <option>Office</option>
                <option>Other</option>
              </select>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Street Address</label>
                <input
                  value={street1}
                  onChange={(e) => setStreet1(e.target.value)}
                  placeholder="House / Flat No., Building, Street"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Address Line 2 <span className="text-slate-600 normal-case font-normal">(optional)</span>
                </label>
                <input
                  value={street2}
                  onChange={(e) => setStreet2(e.target.value)}
                  placeholder="Landmark, Area"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">City</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bengaluru"
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">State</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="">Select</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">PIN Code</label>
                  <input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="560001"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  type="tel"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>
          </section>

          {/* Feedback */}
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">{error}</div>
          )}
          {saved && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Profile saved successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed font-bold rounded-xl text-sm transition-colors"
          >
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
