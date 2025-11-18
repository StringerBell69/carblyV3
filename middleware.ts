import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Routes publiques
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/api/auth',
    '/api/webhooks',
    '/_next',
    '/favicon.ico',
  ];

  // Vérifier si la route est publique
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Routes de réservation publiques (avec token)
  if (pathname.startsWith('/reservation/')) {
    return NextResponse.next();
  }

  // Laisser passer les routes publiques
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Vérifier la session via le cookie
  const sessionToken = req.cookies.get('better-auth.session_token');

  if (!sessionToken && !pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // SuperAdmin routes
  if (pathname.startsWith('/admin')) {
    // TODO: Vérifier si l'utilisateur est SuperAdmin
    // Pour l'instant, on laisse passer
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
