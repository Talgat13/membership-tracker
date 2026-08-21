import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Allow static files, Next.js assets, login page and auth API
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api/auth') ||
    path === '/login' ||
    path === '/favicon.ico' ||
    path.includes('.')
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get('app_session')?.value;

  if (session !== 'authenticated') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
