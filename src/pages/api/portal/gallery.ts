import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { db } from '../../../db';
import { clinics } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

async function getClinicId(userId: string): Promise<string | null> {
  const { users } = await import('../../../db/schema');
  const [u] = await db.select({ clinicId: users.clinicId }).from(users).where(eq(users.id, userId)).limit(1);
  return u?.clinicId ?? null;
}

// GET /api/portal/gallery — get clinic media/gallery
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'clinic_owner', 'admin', 'editor', 'viewer')) return json({ error: 'Forbidden' }, 403);

  try {
    const clinicId = session.clinicId ?? await getClinicId(session.userId);
    if (!clinicId) return json({ data: [], media: null });

    const [clinic] = await db.select({ media: clinics.media }).from(clinics).where(eq(clinics.id, clinicId)).limit(1);
    const gallery = (clinic?.media as { gallery_urls?: string[] } | null)?.gallery_urls ?? [];

    return json({
      data: gallery.map((url, i) => ({ id: `img:${i}`, url, caption: '', alt: '' })),
      media: clinic?.media ?? null,
    });
  } catch (err) {
    console.error('[GET /api/portal/gallery]', err);
    return json({ error: 'Failed to load gallery' }, 500);
  }
};

// PUT /api/portal/gallery — update gallery URLs
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'clinic_owner', 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const clinicId = session.clinicId ?? await getClinicId(session.userId);
    if (!clinicId) return json({ error: 'No clinic linked' }, 403);

    let body: unknown;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    const b = body as { gallery_urls?: string[] };

    const [clinic] = await db.select({ media: clinics.media }).from(clinics).where(eq(clinics.id, clinicId)).limit(1);
    const existing = (clinic?.media as Record<string, unknown>) ?? {};

    await db.update(clinics).set({
      media: { ...existing, gallery_urls: b.gallery_urls ?? [] },
      updatedAt: new Date(),
    }).where(eq(clinics.id, clinicId));

    return json({ success: true });
  } catch (err) {
    console.error('[PUT /api/portal/gallery]', err);
    return json({ error: 'Failed to update gallery' }, 500);
  }
};