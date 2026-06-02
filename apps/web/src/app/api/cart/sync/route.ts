import { NextRequest, NextResponse } from 'next/server';
import { db } from '@electra/db';
import { verifyJWT } from '@electra/auth';

/**
 * POST /api/cart/sync
 * Syncs the frontend localStorage cart to the database before checkout.
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT<{ id: string }>(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body; // Array of { id: productId, quantity: number }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Upsert the cart
    const cart = await db.cart.upsert({
      where: { userId: payload.id },
      update: {},
      create: { userId: payload.id },
    });

    // Clear existing items in DB cart
    await db.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // Insert new items
    if (items.length > 0) {
      await db.cartItem.createMany({
        data: items.map((item: any) => ({
          cartId: cart.id,
          productId: item.id,
          quantity: item.quantity,
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cart sync error:', error);
    return NextResponse.json({ error: error.message || 'Failed to sync cart' }, { status: 500 });
  }
}
