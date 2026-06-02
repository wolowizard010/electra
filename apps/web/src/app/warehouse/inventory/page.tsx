'use client';

import React, { useEffect, useState } from 'react';

interface Inventory {
  productId: string;
  quantity: number;
  reserved: number;
  location: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  isActive: boolean;
  inventory?: Inventory | null;
}

export default function WarehouseInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReplenishModal, setShowReplenishModal] = useState<string | null>(null); // productId

  // Forms
  const [replenishAmount, setReplenishAmount] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({
    sku: '', name: '', price: '', quantity: '', location: '', description: '', weightKg: '', widthCm: '', heightCm: '', depthCm: ''
  });

  const fetchInventory = async () => {
    try {
      setError(null);
      const res = await fetch('/api/admin/inventory');
      if (!res.ok) throw new Error('Failed to load inventory. Ensure you have operator access.');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleReplenish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReplenishModal || !replenishAmount || replenishAmount <= 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/inventory/replenish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: showReplenishModal, amount: replenishAmount }),
      });
      if (!res.ok) throw new Error('Failed to replenish stock');
      setShowReplenishModal(null);
      setReplenishAmount('');
      await fetchInventory();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to add product');
      }
      setShowAddModal(false);
      setAddForm({ sku: '', name: '', price: '', quantity: '', location: '', description: '', weightKg: '', widthCm: '', heightCm: '', depthCm: '' });
      await fetchInventory();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Inventory Management
            </h1>
            <p className="text-slate-400 mt-2">Warehouse Catalog & Stock Levels</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={fetchInventory}
              className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition text-sm font-semibold"
            >
              Refresh
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition text-sm font-bold text-white shadow-lg"
            >
              + Add New Item
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-950 text-xs uppercase font-bold text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Product Details</th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4 text-center">In Stock</th>
                    <th className="px-6 py-4 text-center">Reserved</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {products.map((product) => {
                    const qty = product.inventory?.quantity || 0;
                    const res = product.inventory?.reserved || 0;
                    const available = qty - res;
                    return (
                      <tr key={product.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-200">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">{product.sku}</td>
                        <td className="px-6 py-4">₹{product.price.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-md font-bold ${available <= 0 ? 'bg-rose-500/10 text-rose-400' : available <= 5 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {qty}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-slate-500">{res}</td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">{product.inventory?.location || 'N/A'}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setShowReplenishModal(product.id)}
                            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg text-xs font-bold transition"
                          >
                            + Replenish
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
              <div className="p-6 border-b border-slate-800">
                <h3 className="text-xl font-bold text-white">Add New Catalog Item</h3>
              </div>
              <form onSubmit={handleAddProduct} className="p-6 space-y-4 text-sm max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Product Name</label>
                  <input required value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" placeholder="e.g. Sony WH-1000XM5" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Description</label>
                  <textarea required rows={3} value={addForm.description} onChange={e => setAddForm({...addForm, description: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" placeholder="Detailed product description..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">SKU</label>
                    <input required value={addForm.sku} onChange={e => setAddForm({...addForm, sku: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500" placeholder="ELEC-HD-001" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Price (₹)</label>
                    <input required type="number" min="0" value={addForm.price} onChange={e => setAddForm({...addForm, price: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" placeholder="29990" />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Weight (kg)</label>
                    <input required type="number" step="0.01" min="0" value={addForm.weightKg} onChange={e => setAddForm({...addForm, weightKg: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" placeholder="1.2" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Width (cm)</label>
                    <input required type="number" step="0.1" min="0" value={addForm.widthCm} onChange={e => setAddForm({...addForm, widthCm: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" placeholder="10" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Height (cm)</label>
                    <input required type="number" step="0.1" min="0" value={addForm.heightCm} onChange={e => setAddForm({...addForm, heightCm: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" placeholder="10" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Depth (cm)</label>
                    <input required type="number" step="0.1" min="0" value={addForm.depthCm} onChange={e => setAddForm({...addForm, depthCm: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" placeholder="10" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Initial Stock Qty</label>
                    <input required type="number" min="0" value={addForm.quantity} onChange={e => setAddForm({...addForm, quantity: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" placeholder="50" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Warehouse Location</label>
                    <input required value={addForm.location} onChange={e => setAddForm({...addForm, location: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500" placeholder="Aisle C, Shelf 4" />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold">Create Item</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Replenish Modal */}
        {showReplenishModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-800">
                <h3 className="text-xl font-bold text-white">Replenish Stock</h3>
                <p className="text-sm text-slate-400 mt-1">Add units to the physical inventory.</p>
              </div>
              <form onSubmit={handleReplenish} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Units to Add</label>
                  <input required type="number" min="1" value={replenishAmount} onChange={e => setReplenishAmount(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-lg" placeholder="10" />
                </div>
                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setShowReplenishModal(null)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-sm">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm">Update Stock</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
