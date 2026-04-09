import type { APIRoute } from 'astro';
import { createUser, getUserByEmail, createToken, createSessionCookie } from '../../../utils/auth';
import { sendFunnelEmail, DRIP_SEQUENCES } from '../../../utils/nurtureFunnel';
import { checkRateLimit } from '../../../utils/rateLimit';
import { db } from '../../../db';
import { leads } from '../../../db/schema';
import { z } from 'zod';

export const prerender = false;

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const POST: APIRoute = async ({ request }) => {
  const blocked = await checkRateLimit(request, 'form');
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user already exists
    const existing = await getUserByEmail(parsed.data.email);
    if (existing) {
      return new Response(JSON.stringify({ error: 'An account with this email already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create user with 'viewer' role (patient)
    const user = await createUser(parsed.data.email, parsed.data.password, parsed.data.name, 'viewer');

    if (!user) {
      return new Response(JSON.stringify({ error: 'Failed to create account' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create session
    const payload = { userId: user.id, email: user.email, role: user.role };
    const cookie = createSessionCookie(payload);

    // Enter patient nurturing funnel
    db.insert(leads).values({
      type: 'newsletter',
      email: user.email,
      name: parsed.data.name,
      metadata: {
        funnel_segment: 'patient',
        funnel_entered_at: new Date().toISOString(),
        funnel_completed_steps: ['patient_welcome'],
        source: 'registration',
      },
    }).catch(() => {});

    // Send patient welcome drip email
    const firstStep = DRIP_SEQUENCES.patient[0];
    if (firstStep) {
      sendFunnelEmail(
        { email: user.email, name: parsed.data.name, segment: 'patient' },
        firstStep
      ).catch(() => {});
    }

    return new Response(JSON.stringify({ success: true, user: { id: user.id, name: user.name, email: user.email } }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
