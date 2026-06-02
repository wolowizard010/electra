'use strict';
'use client';

import React, { useEffect, useState } from 'react';

interface OrderItem {
  id: string;
  quantity: number;
  pricePaid: number;
  product: {
    sku: string;
    name: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: 'PAID' | 'PROCESSING' | 'SHIPPED';
  totalAmount: number;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  shippingAddress: {
    street1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: OrderItem[];
  shipments?: {
    carrier: string;
    trackingNumber: string;
    shippingLabelUrl: string;
  }[];
}

export default function WarehouseOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch backlog orders
  const fetchOrders = async () => {
    try {
      setError(null);
      const res = await fetch('/api/admin/orders');
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Access denied. Operator authentication required.');
        }
        throw new Error('Failed to load orders.');
      }
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Action: Start Packing
  const handleStartPacking = async (orderId: string) => {
    try {
      setActioningId(orderId);
      setError(null);
      const res = await fetch(`/api/admin/orders/${orderId}/pack`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update order state.');
      }
      // Refresh list
      await fetchOrders();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActioningId(null);
    }
  };

  // Action: Generate Label and Ship
  const handleShipOrder = async (orderId: string) => {
    try {
      setActioningId(orderId);
      setError(null);
      const res = await fetch(`/api/admin/orders/${orderId}/ship`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate shipping label.');
      }
      const result = await res.json();
      alert(`Label purchased successfully!\nCarrier: ${result.shipping.carrier}\nTracking: ${result.shipping.trackingNumber}`);
      // Refresh list
      await fetchOrders();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Electra Logistics Portal
            </h1>
            <p className="text-slate-400 mt-2">Warehouse Packing & Fulfillment Backlog (India Operations)</p>
          </div>
          <button 
            onClick={fetchOrders}
            className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition text-sm font-semibold"
          >
            Refresh Backlog
          </button>
        </header>

        {/* Error Callout */}
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
            <p className="text-slate-400 text-lg">No orders currently in packing queue. Good job!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const isProcessing = order.status === 'PROCESSING';
              const isActioning = actioningId === order.id;

              return (
                <div 
                  key={order.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col md:flex-row hover:border-slate-700 transition duration-300"
                >
                  
                  {/* Left Column: Order metadata */}
                  <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-mono font-bold text-emerald-400">{order.orderNumber}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          isProcessing 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="text-xs text-slate-500 font-mono mb-4">
                        Date: {new Date(order.createdAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>

                      <div className="mb-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Customer</h4>
                        <div className="text-sm font-bold text-slate-200">{order.user.firstName} {order.user.lastName}</div>
                        <div className="text-xs text-slate-400">{order.user.email}</div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Deliver To</h4>
                        <div className="text-xs text-slate-400 leading-relaxed">
                          {order.shippingAddress.street1}<br />
                          {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}<br />
                          {order.shippingAddress.country}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800/50 mt-4 md:mt-0">
                      <div className="text-xs font-bold text-slate-500">Value Charged</div>
                      <div className="text-lg font-black text-slate-100">₹{Number(order.totalAmount).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>

                  {/* Right Column: Items checklist & Packing controls */}
                  <div className="p-6 md:w-2/3 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-4">Packing Checklist</h3>
                      
                      <div className="space-y-3">
                        {order.items.map((item) => (
                          <div 
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800/40 rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              {/* Simple interactive checkbox for packing checklist visual help */}
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer" 
                              />
                              <div>
                                <div className="text-sm font-bold text-slate-200">{item.product.name}</div>
                                <div className="text-xs text-slate-500 font-mono">SKU: {item.product.sku}</div>
                              </div>
                            </div>
                            <span className="text-sm font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                              Qty: {item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Operational controls */}
                    <div className="mt-6 pt-4 border-t border-slate-800/50 flex justify-end gap-3">
                      {!isProcessing ? (
                        <button
                          onClick={() => handleStartPacking(order.id)}
                          disabled={isActioning}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-slate-100 rounded-xl text-sm font-bold shadow-lg transition duration-200 flex items-center gap-2"
                        >
                          {isActioning && actioningId === order.id ? 'Loading...' : 'Start Packing'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleShipOrder(order.id)}
                          disabled={isActioning}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-slate-100 rounded-xl text-sm font-bold shadow-lg transition duration-200 flex items-center gap-2"
                        >
                          {isActioning && actioningId === order.id ? 'Shipping...' : 'Generate Label & Ship (Cheapest)'}
                        </button>
                      )}
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
