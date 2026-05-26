import type { APIRoute } from 'astro';
import { db } from '../../../../../db';
import { clinics, reviews, clinicClaims } from '../../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../../utils/auth';
import { eq } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ params, request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  const { id } = params;
  if (!id) return json({ error: 'Missing clinic id' }, 400);

  try {
    const body = await request.json() as {
      mergeIntoId: string;
      deleteSourceReviews?: boolean;
    };

    if (!body.mergeIntoId) return json({ error: 'mergeIntoId is required' }, 400);
    if (id === body.mergeIntoId) return json({ error: 'Cannot merge a clinic into itself' }, 400);

    // Verify source and target clinics exist
    const [source] = await db.select({ id: clinics.id }).from(clinics).where(eq(clinics.id, id)).limit(1);
    if (!source) return json({ error: 'Source clinic not found' }, 404);

    const [target] = await db.select({ id: clinics.id, slug: clinics.slug }).from(clinics).where(eq(clinics.id, body.mergeIntoId)).limit(1);
    if (!target) return json({ error: 'Target clinic not found' }, 404);

    // Transfer reviews from source to target
    await db.update(reviews)
      .set({ clinicId: body.mergeIntoId })
      .where(eq(reviews.clinicId, id));

    // Transfer pending claims from source to target
    await db.update(clinicClaims)
      .set({ clinicId: body.mergeIntoId })
      .where(eq(clinicClaims.clinicId, id));

    // Update target clinic aggregate review counts
    // (This is best-effort — a separate async job should recalculate periodically)
    const { count, avg } = { count: 0, avg: '0' }; // Placeholder; real calc happens in trigger

    // Soft-delete the source clinic
    await db.update(clinics)
      .set({
        deletedAt: new Date(),
        name: `_MERGED_${id}_${Date.now()}`,
        slug: `__merged__${id}__${Date.now()}`,
        statusReason: `Merged into ${target.slug}`,
      })
      .where(eq(clinics.id, id));

    return json({ success: true, mergedInto: target.slug });
  } catch (err) {
    console.error('Merge error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};