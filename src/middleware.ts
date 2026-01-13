import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const session = request.cookies.get('nexus_session');

    // Protected routes
    const protectedRoutes = ['/dashboard', '/capture', '/inspiration', '/settings'];
    const isProtected = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));

    if (isProtected && !session) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // If logged in and visiting login page, redirect to dashboard
    if (request.nextUrl.pathname === '/auth/login' && session) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
