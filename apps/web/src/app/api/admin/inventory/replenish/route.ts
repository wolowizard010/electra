import { NextRequest, NextResponse } from 'next/server';
import { db } from '@electra/db';
import { verifyJWT } from '@electra/auth';

async function checkAdminOrOperator(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  
  const payload = await verifyJWT<{ id: string; role: string }>(token);
  if (!payload || (payload.role !== 'ADMIN' && payload.role !== 'WAREHOUSE_OPERATOR')) {
    return null;
  }
  return payload;
}

export async function POST(request: NextRequest) {
  const user = await checkAdminOrOperator(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { productId, amount } = body;

    if (!productId || amount === undefined) {
      return NextResponse.json({ error: 'Missing productId or amount' }, { status: 400 });
    }

    const qtyToAdd = parseInt(amount, 10);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive integer' }, { status: 400 });
    }

    const inventory = await db.inventory.update({
      where: { productId },
      data: {
        quantity: { increment: qtyToAdd }
      }
    });

    return NextResponse.json({ success: true, inventory });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
