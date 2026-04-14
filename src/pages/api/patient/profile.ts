import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { getSessionFromRequest } from '../../../utils/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || name.trim().length < 2) {
      return new Response(JSON.stringify({ error: 'Name must be at least 2 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.update(users)
      .set({ name: name.trim() })
      .where(eq(users.id, session.userId));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[profile update]', err);
    return new Response(JSON.stringify({ error: 'Failed to update profile' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};