'use client';

import { useCart, type CartItem } from '@/lib/cart-context';
import { useState } from 'react';

interface Props {
  product: Omit<CartItem, 'quantity'>;
  disabled: boolean;
}

export default function AddToCartButton({ product, disabled }: Props) {
  const { addToCart, items } = useCart();
  const [added, setAdded] = useState(false);

  const inCart = items.find((i) => i.id === product.id);

  const handleAdd = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  if (disabled) {
    return (
      <button disabled className="w-full py-4 bg-slate-800 text-slate-500 font-bold rounded-xl cursor-not-allowed text-sm">
        Out of Stock
      </button>
    );
  }

  return (
    <button
      id="add-to-cart-btn"
      onClick={handleAdd}
      className={`w-full py-4 font-bold rounded-xl transition-all duration-200 text-sm
        ${added
          ? 'bg-emerald-600 text-white scale-[0.98]'
          : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-[1.01] active:scale-[0.98]'
        }`}
    >
      {added ? '✓ Added to Cart!' : inCart ? `Add Another (+${inCart.quantity} in cart)` : 'Add to Cart'}
    </button>
  );
}
