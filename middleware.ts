import { NextResponse, type NextRequest } from 'next/server';

import { AUTH_COOKIE_NAME } from '@/lib/auth/constants';

const PROTECTED_PREFIXES = ['/dashboard', '/schedule', '/sessions', '/finance', '/inventory', '/settings', '/users'];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);

  if (pathname === '/login' && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const protectedRoute = PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (protectedRoute && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/schedule/:path*', '/sessions/:path*', '/finance/:path*', '/inventory/:path*', '/settings/:path*', '/users/:path*', '/login']
};
