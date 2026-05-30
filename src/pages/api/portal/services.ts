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

// GET /api/portal/services — list services (specialties/machines) for the clinic
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'clinic_owner', 'admin', 'editor', 'viewer')) return json({ error: 'Forbidden' }, 403);

  try {
    const clinicId = session.clinicId ?? await getClinicId(session.userId);
    if (!clinicId) return json({ data: [] });

    const [clinic] = await db.select({
      machines: clinics.machines,
      specialties: clinics.specialties,
      insurances: clinics.insurances,
      pricing: clinics.pricing,
    }).from(clinics).where(eq(clinics.id, clinicId)).limit(1);

    if (!clinic) return json({ data: [] });

    // Combine machines and specialties into a services list
    const machines = (clinic.machines ?? []).map((m: string) => ({
      id: `machine:${m}`,
      type: 'machine' as const,
      name: m,
    }));
    const specialties = (clinic.specialties ?? []).map((s: string) => ({
      id: `specialty:${s}`,
      type: 'specialty' as const,
      name: s,
    }));

    return json({ data: [...machines, ...specialties] });
  } catch (err) {
    console.error('[GET /api/portal/services]', err);
    return json({ error: 'Failed to load services' }, 500);
  }
};

// PUT /api/portal/services — update services (machines, specialties)
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'clinic_owner', 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const clinicId = session.clinicId ?? await getClinicId(session.userId);
    if (!clinicId) return json({ error: 'No clinic linked' }, 403);

    let body: unknown;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    const b = body as Record<string, unknown>;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if ('machines' in b && Array.isArray(b.machines)) updateData.machines = b.machines;
    if ('specialties' in b && Array.isArray(b.specialties)) updateData.specialties = b.specialties;
    if ('insurances' in b && Array.isArray(b.insurances)) updateData.insurances = b.insurances;

    await db.update(clinics).set(updateData as Parameters<typeof db.update>[2]).where(eq(clinics.id, clinicId));
    return json({ success: true });
  } catch (err) {
    console.error('[PUT /api/portal/services]', err);
    return json({ error: 'Failed to update services' }, 500);
  }
};