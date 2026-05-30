import type { APIRoute } from 'astro';
import { validateSessionStrict } from '../../../utils/auth';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const session = await validateSessionStrict(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Only clinic owners or admins can complete onboarding
  if (session.role !== 'clinic_owner' && session.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { completed } = body;

    if (completed === true) {
      await db.update(users)
        .set({ onboardingCompletedAt: new Date() })
        .where(eq(users.id, session.userId));

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Portal onboarding error:', err);
    return new Response(JSON.stringify({ error: 'Failed to update onboarding status' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};