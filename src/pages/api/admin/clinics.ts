import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { clinics, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

// Verify or update a clinic
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Clinic ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const allowedFields = [
      'verified', 'isFeatured', 'name', 'phone', 'website', 'email',
      'description', 'descriptionLong', 'machines', 'specialties', 'insurances',
      'accessibility', 'availability', 'pricing', 'openingHours',
    ] as const;

    const safeUpdates: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of allowedFields) {
      if (key in updates) {
        safeUpdates[key] = updates[key];
      }
    }

    await db.update(clinics).set(safeUpdates).where(eq(clinics.id, id));

    // Audit log
    await db.insert(auditLog).values({
      userId: session?.userId ?? null,
      action: 'update_clinic',
      entityType: 'clinic',
      entityId: id,
      details: { fields: Object.keys(safeUpdates).filter(k => k !== 'updatedAt') },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin clinic update error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
