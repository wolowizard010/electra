import { NextRequest, NextResponse } from 'next/server';
import { confirmCheckout } from '@electra/orders';
import { verifyJWT } from '@electra/auth';

/**
 * POST: Confirms and finalizes the checkout.
 * Verifies Razorpay payment signature.
 * - Succeeded: registers order, deducts stock, clears cart.
 * - Failed: releases stock.
 * Restricted to authenticated users.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify User Session
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const payload = await verifyJWT<{ id: string; email: string; role: string }>(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid' }, { status: 401 });
    }

    // 2. Parse payload parameters
    const body = await request.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, shippingAddressId } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !shippingAddressId) {
      return NextResponse.json(
        { error: 'Missing required parameters: razorpayOrderId, razorpayPaymentId, razorpaySignature, shippingAddressId' },
        { status: 400 }
      );
    }

    // 3. Confirm Checkout
    const order = await confirmCheckout(
      payload.id,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      shippingAddressId
    );

    return NextResponse.json({
      message: 'Checkout confirmed and order created successfully',
      order,
    });
  } catch (error: any) {
    console.error('Checkout confirmation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to confirm checkout payment' },
      { status: 400 }
    );
  }
}
