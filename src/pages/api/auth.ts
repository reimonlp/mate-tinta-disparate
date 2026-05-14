import type { APIRoute } from 'astro';
import { SignJWT } from 'jose';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { user, pass } = await request.json();

    const adminUser = import.meta.env.ADMIN_USER || 'admin';
    const adminPass = import.meta.env.ADMIN_PASS || 'disparate2026';
    const jwtSecret = import.meta.env.JWT_SECRET || 'fallback-secret-change-me-12345678';

    if (user === adminUser && pass === adminPass) {
      const secret = new TextEncoder().encode(jwtSecret);
      const jwt = await new SignJWT({ user })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);

      cookies.set('admin_session', jwt, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 // 24 hours
      });

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
