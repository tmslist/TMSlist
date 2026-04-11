import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../utils/auth';
import { db } from '../../../db';
import { users, clinics } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const userRows = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    const user = userRows[0];
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    let clinicName: string | null = null;
    if (user.clinicId) {
      const clinicRows = await db.select({ name: clinics.name }).from(clinics).where(eq(clinics.id, user.clinicId)).limit(1);
      clinicName = clinicRows[0]?.name || null;
    }

    return new Response(JSON.stringify({
      email: user.email,
      name: user.name,
      role: user.role,
      clinicId: user.clinicId,
      clinicName,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt?.toISOString() || null,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Portal settings GET error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load settings' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (typeof name === 'string' && name.trim().length > 0) {
      await db.update(users).set({ name: name.trim(), updatedAt: new Date() }).where(eq(users.id, session.userId));
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Portal settings PUT error:', err);
    return new Response(JSON.stringify({ error: 'Failed to update settings' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
