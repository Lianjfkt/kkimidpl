import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const path = url.pathname;
  
  // Read user_role cookie
  const roleCookie = request.cookies.get('user_role');
  const role = roleCookie ? roleCookie.value : null;

  // Paths requiring specific roles
  const isOwnerPath = path.startsWith('/owner');
  const isPelatihPath = path.startsWith('/pelatih');
  const isOrtuPath = path.startsWith('/ortu');
  const isLoginPath = path === '/login';

  // If user is not logged in and attempts to access protected dashboard
  if (!role && (isOwnerPath || isPelatihPath || isOrtuPath)) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If user is logged in
  if (role) {
    // If they attempt to access login page, send them to their dashboard
    if (isLoginPath) {
      url.pathname = `/${role}`;
      return NextResponse.redirect(url);
    }

    // Verify role permissions
    if (isOwnerPath && role !== 'owner') {
      url.pathname = `/${role}`;
      return NextResponse.redirect(url);
    }
    if (isPelatihPath && role !== 'pelatih') {
      url.pathname = `/${role}`;
      return NextResponse.redirect(url);
    }
    if (isOrtuPath && role !== 'ortu') {
      url.pathname = `/${role}`;
      return NextResponse.redirect(url);
    }

    // If they visit the homepage, redirect to dashboard
    if (path === '/') {
      url.pathname = `/${role}`;
      return NextResponse.redirect(url);
    }
  } else {
    // If visiting homepage without login, redirect to login
    if (path === '/') {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Configure middleware matcher to intercept dashboard and login routes
export const config = {
  matcher: ['/', '/login', '/owner/:path*', '/pelatih/:path*', '/ortu/:path*'],
};
