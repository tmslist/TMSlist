import type { APIRoute } from 'astro';
import { db } from '../../../../../db';
import { clinics, slugRedirects } from '../../../../../db/schema';
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
      redirectToSlug?: string;
      reason?: string;
    };

    // Find clinic
    const [clinic] = await db.select({ id: clinics.id, slug: clinics.slug, name: clinics.name })
      .from(clinics).where(eq(clinics.id, id)).limit(1);

    if (!clinic) return json({ error: 'Clinic not found' }, 404);

    // Soft-delete the clinic
    await db.update(clinics)
      .set({
        deletedAt: new Date(),
        slug: `__deleted__${Date.now()}__${clinic.slug}`,
        statusReason: body.reason ?? 'Deleted by admin',
      })
      .where(eq(clinics.id, id));

    // Create redirect if target specified
    if (body.redirectToSlug) {
      const [target] = await db.select({ id: clinics.id, slug: clinics.slug })
        .from(clinics).where(eq(clinics.slug, body.redirectToSlug)).limit(1);

      if (target) {
        await db.insert(slugRedirects).values({
          oldSlug: clinic.slug,
          newSlug: body.redirectToSlug,
          reason: body.reason ?? `Deleted: ${clinic.name}`,
          hits: 0,
        }).onConflictDoUpdate({
          target: slugRedirects.oldSlug,
          set: { newSlug: body.redirectToSlug, reason: body.reason ?? null },
        });
      }
    }

    return json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};