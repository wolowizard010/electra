import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@electra/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isWarehouseRoute = pathname.startsWith('/warehouse') || pathname.startsWith('/api/warehouse');
  const isProtectedRoute = isAdminRoute || isWarehouseRoute || pathname.startsWith('/portal') || pathname.startsWith('/api/portal');

  if (isProtectedRoute) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const payload = await verifyJWT<{ id: string; email: string; role: string }>(token);

    if (!payload) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized: Session invalid' }, { status: 401 });
      }
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }

    // Role Enforcement
    if (isAdminRoute && payload.role !== 'ADMIN') {
      const allowedForOperator = payload.role === 'WAREHOUSE_OPERATOR' && 
        (pathname.startsWith('/api/admin/orders') || pathname.startsWith('/api/admin/inventory'));
      
      if (!allowedForOperator) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    if (isWarehouseRoute && payload.role !== 'ADMIN' && payload.role !== 'WAREHOUSE_OPERATOR') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/warehouse/:path*',
    '/portal/:path*',
    '/api/admin/:path*',
    '/api/warehouse/:path*',
    '/api/portal/:path*',
  ],
};
