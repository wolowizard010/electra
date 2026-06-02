import { db } from '@electra/db';
import { notFound } from 'next/navigation';
import AddToCartButton from './add-to-cart-button';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;

  let product: any = null;
  try {
    product = await db.product.findUnique({
      where: { id },
      include: { inventory: true },
    });
  } catch {
    // DB unavailable
  }

  if (!product) notFound();

  const qty = product.inventory?.quantity ?? 0;
  const res = product.inventory?.reserved ?? 0;
  const available = qty - res;
  const priceINR = parseFloat(product.price.toString());
  const image = product.images?.[0];
  const dims = product.dimensions as any;

  let stockLabel = { text: 'In Stock', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  if (available <= 0) stockLabel = { text: 'Out of Stock', cls: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
  else if (available <= 5) stockLabel = { text: `Only ${available} left — order soon`, cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Breadcrumb */}
        <nav className="text-xs text-slate-500 mb-8 flex items-center gap-2">
          <a href="/" className="hover:text-slate-300 transition-colors">Home</a>
          <span>/</span>
          <a href="/shop" className="hover:text-slate-300 transition-colors">Shop</a>
          <span>/</span>
          <span className="text-slate-400 truncate max-w-xs">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Image */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-white/5">
              {image ? (
                <img src={image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <p className="text-xs text-slate-500 font-mono tracking-wider mb-2">{product.sku}</p>

            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight mb-4">
              {product.name}
            </h1>

            {/* Stock badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-6 w-fit ${stockLabel.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${available > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              {stockLabel.text}
            </div>

            {/* Price */}
            <div className="mb-6">
              <span className="text-4xl font-black text-blue-400">
                ₹{priceINR.toLocaleString('en-IN')}
              </span>
              <span className="text-slate-500 text-sm ml-2">incl. all taxes</span>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Description</h2>
              <p className="text-slate-300 leading-relaxed">{product.description}</p>
            </div>

            {/* Specs */}
            <div className="mb-8 bg-slate-900/60 border border-white/5 rounded-xl p-5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Product Details</h2>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <div className="text-slate-400">SKU</div>
                <div className="text-slate-200 font-mono text-xs">{product.sku}</div>

                <div className="text-slate-400">Weight</div>
                <div className="text-slate-200 font-medium">{product.weightKg} kg</div>

                {dims?.widthCm && <>
                  <div className="text-slate-400">Dimensions</div>
                  <div className="text-slate-200 font-medium">{dims.widthCm} × {dims.heightCm} × {dims.depthCm} cm</div>
                </>}

                <div className="text-slate-400">Warranty</div>
                <div className="text-slate-200 font-medium">2 Years (Manufacturer)</div>

                <div className="text-slate-400">Dispatch</div>
                <div className="text-slate-200 font-medium">Same day if ordered before 3 PM</div>

                <div className="text-slate-400">Returns</div>
                <div className="text-slate-200 font-medium">30-day hassle-free returns</div>

                <div className="text-slate-400">Sold by</div>
                <div className="text-slate-200 font-medium">Electra Private Ltd.</div>
              </div>
            </div>

            {/* Add to cart */}
            <AddToCartButton
              product={{
                id: product.id,
                sku: product.sku,
                name: product.name,
                price: priceINR,
                image: image ?? undefined,
                maxStock: available,
              }}
              disabled={available <= 0}
            />

            {/* Trust badges */}
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[
                { icon: '🚚', text: 'Fast Delivery' },
                { icon: '🛡️', text: '2-Year Warranty' },
                { icon: '🔄', text: '30-Day Returns' },
              ].map((b) => (
                <div key={b.text} className="bg-slate-900/40 border border-white/5 rounded-xl p-3">
                  <div className="text-xl mb-1">{b.icon}</div>
                  <div className="text-xs text-slate-400 font-medium">{b.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
