import { listProducts } from '@electra/catalog';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  let products: any[] = [];

  try {
    const result = await listProducts({ isActive: true });
    products = result.items;
  } catch {
    products = [];
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Page header */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-white">All Products</h1>
          <p className="text-slate-400 mt-1 text-sm">{products.length} items available</p>
        </div>

        {products.length === 0 ? (
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-16 text-center">
            <p className="text-slate-400">No products available right now. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((product) => {
              const qty = product.inventory?.quantity ?? 0;
              const res = product.inventory?.reserved ?? 0;
              const available = qty - res;
              const priceINR = parseFloat(product.price.toString());
              const image = product.images?.[0];

              let stockLabel: { text: string; cls: string } | null = null;
              if (available <= 0) stockLabel = { text: 'Out of Stock', cls: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
              else if (available <= 5) stockLabel = { text: `Only ${available} left`, cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };

              return (
                <Link
                  key={product.id}
                  href={`/shop/${product.id}`}
                  className="group bg-slate-900 border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-200 flex flex-col"
                >
                  {/* Product image */}
                  <div className="aspect-square bg-slate-800 overflow-hidden relative">
                    {image ? (
                      <img
                        src={image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {/* Stock badge overlay */}
                    {stockLabel && (
                      <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold border ${stockLabel.cls}`}>
                        {stockLabel.text}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-grow">
                    <p className="text-xs text-slate-500 font-mono mb-1">{product.sku}</p>
                    <h2 className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition-colors leading-snug mb-3 flex-grow">
                      {product.name}
                    </h2>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-lg font-black text-blue-400">
                        ₹{priceINR.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                        View →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
