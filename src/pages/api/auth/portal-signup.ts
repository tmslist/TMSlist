import type { APIRoute } from 'astro';
import { registerSchema } from '../../../db/validation';
import { getUserByEmail, hashPassword, createSessionCookie } from '../../../utils/auth';
import { strictRateLimit, getClientIp } from '../../../utils/rateLimit';
import { db } from '../../../db';
import { users } from '../../../db/schema';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Rate limit: 3 requests per IP per 15 minutes
    const ip = getClientIp(request);
    const rateLimited = await strictRateLimit(ip, 3, '15 m', 'auth:portal-signup');
    if (rateLimited) return rateLimited;

    const body = await request.json();

    // Validate with registerSchema but force role to clinic_owner
    const parsed = registerSchema.safeParse({ ...body, role: 'clinic_owner' });

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      let message = 'Invalid input';
      if (firstError?.path.includes('email')) message = 'Please enter a valid email address';
      else if (firstError?.path.includes('password')) message = 'Password must be at least 8 characters';
      else if (firstError?.path.includes('name')) message = 'Name is required (at least 2 characters)';

      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { email, password, name } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existing = await getUserByEmail(normalizedEmail);
    if (existing) {
      return new Response(JSON.stringify({ error: 'Account already exists. Please log in.' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create user with clinic_owner role
    const passwordHash = await hashPassword(password);
    const result = await db.insert(users).values({
      email: normalizedEmail,
      passwordHash,
      name,
      role: 'clinic_owner' as const,
    }).returning();

    const user = result[0];

    const cookie = createSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return new Response(JSON.stringify({
      success: true,
      redirectTo: '/portal/claim',
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
      },
    });
  } catch (err) {
    console.error('Portal signup error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
