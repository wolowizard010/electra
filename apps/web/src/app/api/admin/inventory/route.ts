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

export async function GET(request: NextRequest) {
  const user = await checkAdminOrOperator(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const products = await db.product.findMany({
      include: { inventory: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await checkAdminOrOperator(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { sku, name, description, price, weightKg, widthCm, heightCm, depthCm, quantity, location } = body;

    if (!sku || !name || price === undefined || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const product = await db.product.create({
      data: {
        sku,
        name,
        description: description || '',
        price: parseFloat(price),
        weightKg: parseFloat(weightKg) || 0.1,
        dimensions: { 
          widthCm: parseFloat(widthCm) || 10, 
          heightCm: parseFloat(heightCm) || 10, 
          depthCm: parseFloat(depthCm) || 10 
        },
        images: ['https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=400'], // Default placeholder
        inventory: {
          create: {
            quantity: parseInt(quantity, 10),
            reserved: 0,
            location: location || 'TBD',
          }
        }
      },
      include: { inventory: true }
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
