import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { ADMIN_COOKIE, isValidSession } from '@/lib/auth';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

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
    return NextResponse.next();
  }

  return intlMiddleware(req);
}

export const config = {
  // /admin/:path* keeps the auth branch running; the second pattern hands
  // everything else (except api/_next/_vercel/static files) to next-intl.
  matcher: ['/admin/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
