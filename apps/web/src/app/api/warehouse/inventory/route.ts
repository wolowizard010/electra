import { NextRequest, NextResponse } from 'next/server';
import { updateWarehouseStock } from '@electra/inventory';
import { verifyJWT } from '@electra/auth';

/**
 * PUT: Adjusts physical warehouse stock counts for a product.
 * Restricted to WAREHOUSE_OPERATOR or ADMIN roles.
 */
export async function PUT(request: NextRequest) {
  try {
    // 1. Verify User Session & Role (Double-check boundary)
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const payload = await verifyJWT<{ id: string; email: string; role: string }>(token);
    if (!payload || (payload.role !== 'ADMIN' && payload.role !== 'WAREHOUSE_OPERATOR')) {
      return NextResponse.json(
        { error: 'Forbidden: Warehouse access permissions required' },
        { status: 403 }
      );
    }

    // 2. Parse request payload
    const body = await request.json();
    const { productId, quantity, location } = body;

    if (!productId || quantity === undefined || !location) {
      return NextResponse.json(
        { error: 'Missing required parameters: productId, quantity, location' },
        { status: 400 }
      );
    }

    // 3. Update Warehouse Stock
    await updateWarehouseStock(productId, parseInt(quantity, 10), location);

    return NextResponse.json({
      message: 'Warehouse stock adjusted successfully',
      inventory: {
        productId,
        quantity: parseInt(quantity, 10),
        location,
      },
    });
  } catch (error: any) {
    console.error('Inventory adjust error:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred' },
      { status: 500 }
    );
  }
}
