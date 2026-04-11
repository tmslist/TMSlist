import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../utils/auth';
import { db } from '../../../db';
import { leads, users } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const userRows = await db.select({ clinicId: users.clinicId }).from(users).where(eq(users.id, session.userId)).limit(1);
    const clinicId = userRows[0]?.clinicId;

    if (!clinicId) {
      return new Response(JSON.stringify({ error: 'No clinic linked' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const clinicLeads = await db.select({
      id: leads.id,
      name: leads.name,
      email: leads.email,
      phone: leads.phone,
      message: leads.message,
      type: leads.type,
      createdAt: leads.createdAt,
    })
      .from(leads)
      .where(eq(leads.clinicId, clinicId))
      .orderBy(desc(leads.createdAt));

    return new Response(JSON.stringify({ leads: clinicLeads }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Portal leads error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load leads' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
