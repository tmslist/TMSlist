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

const ADMIN_EMAILS = (import.meta.env.ADMIN_EMAILS || process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

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

  // Determine role: admin if in ADMIN_EMAILS, else clinic_owner
  const isAdmin = ADMIN_EMAILS.includes(normalizedEmail);
  const role = isAdmin ? 'admin' as const : 'clinic_owner' as const;

  // Look up or create user
  let user = await getUserByEmail(normalizedEmail);

  if (!user) {
    const created = await db.insert(users).values({
      email: normalizedEmail,
      name: normalizedEmail.split('@')[0],
      role,
    }).returning();
    user = created[0];
    console.log(`[dev-login] Created new user: ${normalizedEmail} (${user.id}, role: ${role})`);
  } else {
    // Ensure existing user has correct admin role if they should be an admin
    if (isAdmin && user.role !== 'admin') {
      await db.update(users).set({ role: 'admin' }).where(eq(users.id, user.id));
      console.log(`[dev-login] Promoted user ${normalizedEmail} to admin role`);
    }
  }

  // Update last login
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  const cookie = createSessionCookie({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Redirect to appropriate page based on role
  const redirectTo = isAdmin
    ? '/admin/dashboard'
    : (user.clinicId ? '/portal/dashboard' : '/portal/claim');

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
