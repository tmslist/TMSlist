import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { clinics, doctors, reviews, leads, auditLog } from '../../../db/schema';
import { eq, sql, inArray } from 'drizzle-orm';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  try {
    const dupes = await db.execute(sql`
      SELECT c1.id as id1, c1.name as name1, c1.city as city1, c1.state as state1, c1.verified as verified1, c1.review_count as reviews1,
             c2.id as id2, c2.name as name2, c2.city as city2, c2.state as state2, c2.verified as verified2, c2.review_count as reviews2
      FROM clinics c1 JOIN clinics c2 ON c1.id < c2.id
      WHERE (c1.name = c2.name AND c1.city = c2.city)
         OR (c1.phone IS NOT NULL AND c1.phone = c2.phone)
      LIMIT 50
    `);

    return new Response(JSON.stringify({ pairs: dupes.rows || [] }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Admin duplicates error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  try {
    const { action, keepId, deleteId } = await request.json();
    if (action !== 'merge' || !keepId || !deleteId) return new Response(JSON.stringify({ error: 'Invalid' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    await db.update(doctors).set({ clinicId: keepId }).where(eq(doctors.clinicId, deleteId));
    await db.update(reviews).set({ clinicId: keepId }).where(eq(reviews.clinicId, deleteId));
    await db.update(leads).set({ clinicId: keepId }).where(eq(leads.clinicId, deleteId));
    await db.delete(clinics).where(eq(clinics.id, deleteId));

    await db.insert(auditLog).values({ userId: session?.userId, action: 'merge_clinics', entityType: 'clinic', entityId: keepId, details: { mergedFrom: deleteId } });

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Admin duplicates merge error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
