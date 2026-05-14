import { defineMiddleware } from "astro:middleware";
import { jwtVerify } from "jose";

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  // Excluir la página de login y la API de auth
  if (url.pathname === '/admin/login' || url.pathname === '/api/auth') {
    return next();
  }

  // Solo protegemos /admin y /api
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api')) {
    const sessionCookie = context.cookies.get('admin_session');
    const jwtSecret = import.meta.env.JWT_SECRET || 'fallback-secret-change-me-12345678';
    const secret = new TextEncoder().encode(jwtSecret);

    if (sessionCookie) {
      try {
        await jwtVerify(sessionCookie.value, secret);
        return next();
      } catch (e) {
        console.error("JWT Verification failed", e);
      }
    }

    // Si es una ruta de API, devolvemos 401
    if (url.pathname.startsWith('/api')) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Si es una ruta de admin, redirigimos al login
    return context.redirect('/admin/login');
  }

  return next();
});
