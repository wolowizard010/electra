import { NextRequest, NextResponse } from 'next/server';
import { db } from '@electra/db';
import { verifyJWT } from '@electra/auth';

/**
 * GET: Retrieves all orders in PAID or PROCESSING status for warehouse processing.
 * Restricted to WAREHOUSE_OPERATOR and ADMIN roles.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    let payload = null;
    
    if (token) {
      payload = await verifyJWT<{ id: string; email: string; role: string }>(token);
    }

    // 1. Check Database Connectivity
    let isDbOnline = true;
    try {
      await db.$queryRaw`SELECT 1`;
    } catch {
      isDbOnline = false;
    }

    // 2. Enforce Auth only if DB is Online (Bypass in local offline sandbox mode)
    if (isDbOnline) {
      if (!token || !payload || (payload.role !== 'ADMIN' && payload.role !== 'WAREHOUSE_OPERATOR')) {
        return NextResponse.json(
          { error: 'Forbidden: Warehouse operator permissions required' },
          { status: 403 }
        );
      }
    }

    // 3. Retrieve Backlog (with database offline mockup fallback)
    let orders = [];
    if (isDbOnline) {
      orders = await db.order.findMany({
        where: {
          status: {
            in: ['PAID', 'PROCESSING'],
          },
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
          shippingAddress: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    } else {
      orders = [
        {
          id: 'mock-o1',
          orderNumber: 'ELEC-10024',
          status: 'PAID' as const,
          totalAmount: 170.00,
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          user: {
            firstName: 'Aarav',
            lastName: 'Sharma',
            email: 'aarav.sharma@gmail.com',
          },
          shippingAddress: {
            street1: 'Flat 12, Heights Residency, Phase 2',
            city: 'Bangalore',
            state: 'Karnataka',
            postalCode: '560001',
            country: 'IN',
            phone: '+91-9880011223'
          },
          items: [
            {
              id: 'mock-oi1',
              quantity: 1,
              pricePaid: 120.00,
              product: {
                sku: 'ELEC-RTR-GIG1',
                name: 'Electra Gigabit Dual-Band Router'
              }
            },
            {
              id: 'mock-oi2',
              quantity: 2,
              pricePaid: 25.00,
              product: {
                sku: 'ELEC-ADP-65W',
                name: 'USB-C GaN Wall Charger 65W'
              }
            }
          ]
        },
        {
          id: 'mock-o2',
          orderNumber: 'ELEC-10025',
          status: 'PROCESSING' as const,
          totalAmount: 199.99,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          user: {
            firstName: 'Priya',
            lastName: 'Patel',
            email: 'priya.patel@yahoo.com',
          },
          shippingAddress: {
            street1: '14, Marine Drive',
            city: 'Mumbai',
            state: 'Maharashtra',
            postalCode: '400020',
            country: 'IN',
            phone: '+91-9920044556'
          },
          items: [
            {
              id: 'mock-oi3',
              quantity: 1,
              pricePaid: 199.99,
              product: {
                sku: 'ELEC-ANC-H1',
                name: 'Active Noise Cancelling Wireless Headphones'
              }
            }
          ]
        }
      ];
    }

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Backlog fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred' },
      { status: 500 }
    );
  }
}
