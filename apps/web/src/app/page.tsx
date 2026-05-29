import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Home() {
  // Logged-in users go straight to the shop
  const cookieStore = await cookies();
  if (cookieStore.get('electra_user')) {
    redirect('/shop');
  }

  return (
    <div className="text-slate-100 font-sans">

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-3xl" />
      </div>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-semibold tracking-wider uppercase mb-8">
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
          Free shipping on orders above ₹999
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
          The Best in{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Electronics
          </span>
          ,<br />Delivered to You.
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
          Electra brings you premium smartphones, laptops, audio, and more — sourced from top brands and shipped fast across India.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/shop"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/25"
          >
            Browse the Store →
          </Link>
          <Link
            href="/register"
            className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold text-lg rounded-xl transition-all duration-200"
          >
            Create Account
          </Link>
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { icon: '⚡', title: 'Same-Day Dispatch', desc: 'Orders placed before 3 PM ship the same day from our warehouses.' },
            { icon: '🛡️', title: '2-Year Warranty', desc: 'Every product comes with a full manufacturer warranty plus our own guarantee.' },
            { icon: '🔄', title: 'Easy Returns', desc: 'Changed your mind? Return within 30 days for a hassle-free refund.' },
          ].map((f) => (
            <div key={f.title}>
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-white mb-1">{f.title}</h3>
              <p className="text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="max-w-5xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3 block">About Electra</span>
          <h2 className="text-3xl font-black text-white mb-4 leading-tight">
            India's Trusted Electronics Destination
          </h2>
          <p className="text-slate-400 leading-relaxed mb-4">
            Founded in 2020, Electra is a private electronics company dedicated to bringing world-class technology to Indian consumers at fair prices.
          </p>
          <p className="text-slate-400 leading-relaxed">
            We partner directly with manufacturers and authorised distributors — cutting out the middleman so you get genuine products, great prices, and fast delivery across all major Indian cities.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { value: '50,000+', label: 'Happy Customers' },
            { value: '500+', label: 'Products' },
            { value: '28', label: 'States Served' },
            { value: '4.8★', label: 'Avg. Rating' },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 text-center">
              <div className="text-2xl font-black text-blue-400 mb-1">{stat.value}</div>
              <div className="text-xs text-slate-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-600">
        © 2026 Electra Private Ltd. · All Rights Reserved.
      </footer>
    </div>
  );
}
