import { NextRequest, NextResponse } from 'next/server';
import { listProducts, createProduct } from '@electra/catalog';
import { verifyJWT } from '@electra/auth';

/**
 * GET: Lists active products in the shop catalog.
 * Supports filters: query, minPrice, maxPrice, limit, offset.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || undefined;
    const minPriceStr = searchParams.get('minPrice');
    const maxPriceStr = searchParams.get('maxPrice');
    const limitStr = searchParams.get('limit');
    const offsetStr = searchParams.get('offset');

    const minPrice = minPriceStr ? parseFloat(minPriceStr) : undefined;
    const maxPrice = maxPriceStr ? parseFloat(maxPriceStr) : undefined;
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    const result = await listProducts(
      {
        query,
        minPrice,
        maxPrice,
        isActive: true, // Only show active products to catalog public
      },
      limit,
      offset
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Catalog fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch catalog items' },
      { status: 500 }
    );
  }
}

/**
 * POST: Creates a new catalog item.
 * Restricted to ADMIN role.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify Authentication & Role
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const payload = await verifyJWT<{ id: string; email: string; role: string }>(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { sku, name, description, price, weightKg, dimensions, images } = body;

    if (!sku || !name || price === undefined || weightKg === undefined || !dimensions) {
      return NextResponse.json(
        { error: 'Missing required product parameters: sku, name, price, weightKg, dimensions' },
        { status: 400 }
      );
    }

    const product = await createProduct({
      sku,
      name,
      description: description || '',
      price: Number(price),
      weightKg: Number(weightKg),
      dimensions: {
        widthCm: Number(dimensions.widthCm || 0),
        heightCm: Number(dimensions.heightCm || 0),
        depthCm: Number(dimensions.depthCm || 0),
      },
      images: Array.isArray(images) ? images : [],
    });

    return NextResponse.json(
      { message: 'Product created successfully', product },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred' },
      { status: 500 }
    );
  }
}
