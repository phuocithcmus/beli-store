import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register', // Future registration page
  '/forgot-password', // Future password reset
  '/reset-password', // Future password reset
];

// Define API routes that should be handled differently
const apiRoutes = ['/api/'];

// Define routes that require authentication
const protectedRoutes = [
  '/',
  '/dashboard',
  '/products',
  '/inventory',
  '/sales',
  '/reports',
  '/settings',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log(`Middleware invoked for path: ${pathname}`);

  // Skip middleware for static files, images, and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/icons/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Skip middleware for API routes (let API handle its own auth)
  if (apiRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Get authentication token from cookies or headers
  const token =
    request.cookies.get('auth_token')?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '');

  // Debug: Log token presence and source
  if (token) {
    const source = request.cookies.get('auth_token')?.value
      ? 'cookie'
      : 'header';
    console.log(
      `Middleware: Token found from ${source}, length: ${token.length}`
    );
  } else {
    console.log('Middleware: No token found in cookies or headers');
    // Debug: Check what cookies are available
    const allCookies = request.cookies.getAll();
    console.log(
      'Available cookies:',
      allCookies.map((c) => c.name)
    );
  }
  // Check if user is authenticated
  const isAuthenticated = Boolean(token);

  // Handle public routes
  if (publicRoutes.includes(pathname)) {
    // If user is already authenticated and trying to access login page,
    // redirect them to dashboard
    if (isAuthenticated && pathname === '/login') {
      const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Allow access to public routes
    return NextResponse.next();
  }

  // Handle protected routes
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  console.log(
    `Middleware: isProtectedRoute=${isProtectedRoute}, isAuthenticated=${isAuthenticated}, pathname=${pathname}`
  );

  if (isProtectedRoute && !isAuthenticated) {
    // User is not authenticated, redirect to login
    const loginUrl = new URL('/login', request.url);

    // Add current path as redirect parameter
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }

    // Add reason for better UX
    loginUrl.searchParams.set('reason', 'unauthorized');

    return NextResponse.redirect(loginUrl);
  }

  // For root path, redirect to dashboard if authenticated
  if (pathname === '/' && isAuthenticated) {
    return NextResponse.redirect(new URL('/products', request.url));
  }

  // Default: allow the request to continue
  return NextResponse.next();
}

// Configure which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|icons).*)',
  ],
};

// Note: This middleware provides basic route protection, but the real
// authentication validation happens in the API routes and components.
// Tokens should be validated server-side for security.
