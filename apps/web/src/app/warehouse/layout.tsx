'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function WarehouseLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const links = [
    { href: '/warehouse/orders', label: 'Orders Backlog' },
    { href: '/warehouse/inventory', label: 'Inventory Management' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <nav className="bg-slate-900 border-b border-slate-800 p-4">
        <div className="max-w-6xl mx-auto flex gap-6">
          <div className="font-black text-white mr-4 tracking-tight flex items-center">
            <span className="text-emerald-400 mr-2">⚡</span> WAREHOUSE
          </div>
          {links.map(l => (
            <Link 
              key={l.href} 
              href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                pathname === l.href 
                  ? 'bg-slate-800 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="ml-auto flex items-center">
             <Link href="/" className="text-xs text-slate-500 hover:text-slate-300">Exit Portal</Link>
          </div>
        </div>
      </nav>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
