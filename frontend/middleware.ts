import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to login page
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Protect admin dashboard route
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    // Check for authentication cookie and token
    const adminAuth = request.cookies.get('adminAuth')?.value;
    const adminToken = request.cookies.get('adminToken')?.value;

    if (!adminAuth || adminAuth !== 'true' || !adminToken) {
      // Redirect to admin login if not authenticated
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
