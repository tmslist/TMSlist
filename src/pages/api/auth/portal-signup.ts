import type { APIRoute } from 'astro';
import { registerSchema } from '../../../db/validation';
import { hashPassword, isPasswordStrongEnough, createMagicToken, getUserByEmail } from '../../../utils/auth';
import { strictRateLimit } from '../../../utils/rateLimit';
import { sendEmailVerificationEmail } from '../../../utils/email';
import { db } from '../../../db';
import { users } from '../../../db/schema';

export const prerender = false;

const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Rate limit: 3 signups per IP per 15 minutes
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '';
    const rateLimited = await strictRateLimit(ip || 'unknown', 3, '15 m', 'auth:portal-signup');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = registerSchema.safeParse({ ...body, role: 'clinic_owner' });

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      let message = 'Invalid input';
      if (firstError?.path.includes('email')) message = 'Please enter a valid email address';
      else if (firstError?.path.includes('password')) message = 'Password must be at least 8 characters';
      else if (firstError?.path.includes('name')) message = 'Name is required (at least 2 characters)';
      else if (firstError?.path.includes('termsAccepted')) message = 'You must accept the terms and privacy policy';
      else message = firstError?.message || 'Invalid input';

      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { email, password, name, npiNumber, termsAccepted } = parsed.data;

    // Enforce password strength
    if (!isPasswordStrongEnough(password)) {
      return new Response(JSON.stringify({
        error: 'Password is too weak. Use at least 8 characters with uppercase, lowercase, numbers, and special characters.',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existing = await getUserByEmail(normalizedEmail);
    if (existing) {
      return new Response(JSON.stringify({ error: 'Account already exists. Please log in.' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create user with pending_verification role (email not yet verified)
    const passwordHash = await hashPassword(password);
    const result = await db.insert(users).values({
      email: normalizedEmail,
      passwordHash,
      name,
      role: 'clinic_owner' as const,
      emailVerified: false,
      npiNumber: npiNumber || null,
      termsAcceptedAt: termsAccepted ? new Date() : null,
    }).returning();

    const user = result[0];

    // Send email verification link
    const token = await createMagicToken(normalizedEmail, 'email-verification');
    const verificationUrl = `${SITE_URL}/api/auth/verify-email?token=${token}`;

    if (import.meta.env.DEV || process.env.NODE_ENV === 'development') {
      console.log(`\n📧 [DEV] Email verification for ${normalizedEmail}:\n   ${verificationUrl}\n`);
    }

    await sendEmailVerificationEmail({
      to: normalizedEmail,
      userName: name,
      verificationUrl,
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Account created. Please check your email to verify your address.',
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Portal signup error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
