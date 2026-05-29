import { NextRequest, NextResponse } from 'next/server';
import { initiateCheckout } from '@electra/orders';
import { verifyJWT } from '@electra/auth';

/**
 * POST: Initiates the checkout sequence.
 * Fetches user's cart, reserves inventory, and returns a Razorpay Order ID.
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

    // 2. Initiate Checkout
    const checkoutSession = await initiateCheckout(payload.id);

    return NextResponse.json({
      message: 'Checkout session initiated successfully',
      checkoutSession,
    });
  } catch (error: any) {
    console.error('Checkout initiate error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate checkout session' },
      { status: 400 }
    );
  }
}
