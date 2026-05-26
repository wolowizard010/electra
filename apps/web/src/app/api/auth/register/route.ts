import { NextRequest, NextResponse } from 'next/server';
import { db } from '@electra/db';
import { hashPassword } from '@electra/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, role } = body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, firstName, lastName' },
        { status: 400 }
      );
    }

    // Check if email format is correct
    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password and save user
    const passwordHash = await hashPassword(password);
    
    // Assign role, restrict role creation to safe defaults (or permit explicit roles for sandbox testing)
    const assignedRole = role && ['CUSTOMER', 'WAREHOUSE_OPERATOR', 'SUPPORT_SPECIALIST', 'ADMIN'].includes(role)
      ? role
      : 'CUSTOMER';

    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: assignedRole,
      },
    });

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred' },
      { status: 500 }
    );
  }
}
