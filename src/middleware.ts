import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware para autenticación y verificación de acceso
export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Rutas que no requieren autenticación
    const publicPaths = ['/login', '/_next', '/favicon.ico'];
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

    if (isPublicPath) {
        return NextResponse.next();
    }

    // Verificar autenticación
    const authToken = request.cookies.get('auth_token')?.value;
    const authRole = request.cookies.get('auth_role')?.value;
    const authExpiry = request.cookies.get('auth_expiry')?.value;

    // Verificar si la sesión ha expirado
    if (authExpiry && parseInt(authExpiry) < Date.now()) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth_token');
        response.cookies.delete('auth_role');
        response.cookies.delete('auth_expiry');
        return response;
    }

    // Si no está autenticado, redirigir a login
    if (!authToken || !authRole) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verificar acceso a rutas de administración
    if (pathname.startsWith('/admin')) {
        if (authRole !== 'admin') {
            // Usuario no administrador intentando acceder a admin
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // Para rutas de usuario normal, permitir acceso
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
};
