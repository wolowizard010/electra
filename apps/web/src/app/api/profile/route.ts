import { NextRequest, NextResponse } from 'next/server';
import { db } from '@electra/db';
import { verifyJWT } from '@electra/auth';

async function getUser(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  const payload = await verifyJWT<{ id: string }>(token);
  return payload;
}

// GET /api/profile — fetch current user + default address
export async function GET(request: NextRequest) {
  const payload = await getUser(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const user = await db.user.findUnique({
      where: { id: payload.id },
      include: { addresses: { where: { isDefault: true }, take: 1 } },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      address: user.addresses[0] ?? null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT /api/profile — update name + upsert default address
export async function PUT(request: NextRequest) {
  const payload = await getUser(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { firstName, lastName, address } = body;

    // Update name
    const user = await db.user.update({
      where: { id: payload.id },
      data: { firstName, lastName },
    });

    // Upsert default address if provided
    let addressId = null;
    if (address) {
      const existing = await db.address.findFirst({
        where: { userId: payload.id, isDefault: true },
      });

      const addressData = {
        label: address.label || 'Home',
        street1: address.street1,
        street2: address.street2 || null,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: 'India',
        phone: address.phone,
        isDefault: true,
      };

      if (existing) {
        const updated = await db.address.update({ where: { id: existing.id }, data: addressData });
        addressId = updated.id;
      } else {
        const created = await db.address.create({ data: { userId: payload.id, ...addressData } });
        addressId = created.id;
      }
    }

    return NextResponse.json({ success: true, firstName: user.firstName, lastName: user.lastName, addressId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
