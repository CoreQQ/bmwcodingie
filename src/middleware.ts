import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, isValidSession } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the login page and its POST action through.
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin')) {
    const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
    const ok = await isValidSession(cookie);
    if (!ok) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
