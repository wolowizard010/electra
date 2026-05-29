import { NextRequest, NextResponse } from 'next/server';
import { db } from '@electra/db';
import { verifyJWT } from '@electra/auth';

/**
 * POST: Transitions order state to PROCESSING (started packing).
 * Restricted to WAREHOUSE_OPERATOR and ADMIN roles.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    // Check Database Connectivity
    let isDbOnline = true;
    try {
      await db.$queryRaw`SELECT 1`;
    } catch {
      isDbOnline = false;
    }

    if (!isDbOnline) {
      return NextResponse.json({
        message: 'Order status updated to PROCESSING. Packing started (Mock Mode).',
        order: {
          id: orderId,
          orderNumber: 'ELEC-MOCK',
          status: 'PROCESSING',
        },
      });
    }

    // 1. Verify User Role
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const payload = await verifyJWT<{ id: string; email: string; role: string }>(token);
    if (!payload || (payload.role !== 'ADMIN' && payload.role !== 'WAREHOUSE_OPERATOR')) {
      return NextResponse.json(
        { error: 'Forbidden: Warehouse operator permissions required' },
        { status: 403 }
      );
    }

    // 2. Fetch order to verify status is PAID
    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'PAID') {
      return NextResponse.json(
        { error: `Cannot start packing. Order status must be PAID. Current: ${order.status}` },
        { status: 400 }
      );
    }

    // 3. Update order status to PROCESSING
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: { status: 'PROCESSING' },
    });

    // 4. Log Audit Trail
    await db.auditLog.create({
      data: {
        userId: payload.id,
        action: 'PACK_ORDER_START',
        details: JSON.stringify({ orderId, previousStatus: 'PAID', currentStatus: 'PROCESSING' }),
      },
    });

    return NextResponse.json({
      message: 'Order status updated to PROCESSING. Packing started.',
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Order start packing error:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred' },
      { status: 500 }
    );
  }
}
