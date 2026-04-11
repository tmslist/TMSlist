/**
 * DEV-ONLY: Bypass magic link for local testing.
 * Creates user if needed and sets session cookie directly.
 *
 * Usage: POST /api/auth/dev-login with { "email": "brandingpioneers@gmail.com" }
 * Or GET /api/auth/dev-login?email=brandingpioneers@gmail.com
 */
import type { APIRoute } from 'astro';
import { getUserByEmail, createSessionCookie } from '../../../utils/auth';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

const isDev = import.meta.env.DEV;

async function devLogin(email: string) {
  if (!isDev) {
    return new Response(JSON.stringify({ error: 'Dev login is only available in development' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!email) {
    return new Response(JSON.stringify({ error: 'Email is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Look up or create user
  let user = await getUserByEmail(normalizedEmail);

  if (!user) {
    const created = await db.insert(users).values({
      email: normalizedEmail,
      name: normalizedEmail.split('@')[0],
      role: 'clinic_owner' as const,
    }).returning();
    user = created[0];
    console.log(`[dev-login] Created new user: ${normalizedEmail} (${user.id})`);
  }

  // Update last login
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  const cookie = createSessionCookie({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Redirect to appropriate page
  const redirectTo = user.clinicId ? '/portal/dashboard' : '/portal/claim';

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo,
      'Set-Cookie': cookie,
    },
  });
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const email = url.searchParams.get('email') || '';
  return devLogin(email);
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  return devLogin(body.email || '');
};
