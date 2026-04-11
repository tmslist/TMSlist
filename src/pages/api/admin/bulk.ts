import type { APIRoute } from 'astro';
import { inArray } from 'drizzle-orm';
import { db } from '../../../db';
import { clinics, reviews, leads, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

async function logAction(
  userId: string,
  action: string,
  entityType: string,
  ids: string[],
  details?: Record<string, unknown>
) {
  await db.insert(auditLog).values({
    userId,
    action,
    entityType,
    entityId: ids.join(','),
    details: { ids, ...details },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();
    const { action, ids, data } = body as {
      action: string;
      ids: string[];
      data?: Record<string, unknown>;
    };

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return json({ error: 'Missing action or ids' }, 400);
    }

    if (ids.length > 500) {
      return json({ error: 'Maximum 500 items per bulk action' }, 400);
    }

    switch (action) {
      // ── Clinics ──
      case 'verify_clinics': {
        await db
          .update(clinics)
          .set({ verified: true, updatedAt: new Date() })
          .where(inArray(clinics.id, ids));
        await logAction(session!.userId, 'bulk_verify', 'clinic', ids);
        return json({ success: true, action, count: ids.length });
      }
      case 'unverify_clinics': {
        await db
          .update(clinics)
          .set({ verified: false, updatedAt: new Date() })
          .where(inArray(clinics.id, ids));
        await logAction(session!.userId, 'bulk_unverify', 'clinic', ids);
        return json({ success: true, action, count: ids.length });
      }
      case 'feature_clinics': {
        await db
          .update(clinics)
          .set({ isFeatured: true, updatedAt: new Date() })
          .where(inArray(clinics.id, ids));
        await logAction(session!.userId, 'bulk_feature', 'clinic', ids);
        return json({ success: true, action, count: ids.length });
      }
      case 'unfeature_clinics': {
        await db
          .update(clinics)
          .set({ isFeatured: false, updatedAt: new Date() })
          .where(inArray(clinics.id, ids));
        await logAction(session!.userId, 'bulk_unfeature', 'clinic', ids);
        return json({ success: true, action, count: ids.length });
      }
      case 'delete_clinics': {
        await db.delete(clinics).where(inArray(clinics.id, ids));
        await logAction(session!.userId, 'bulk_delete', 'clinic', ids);
        return json({ success: true, action, count: ids.length });
      }

      // ── Reviews ──
      case 'approve_reviews': {
        await db
          .update(reviews)
          .set({ approved: true })
          .where(inArray(reviews.id, ids));
        await logAction(session!.userId, 'bulk_approve', 'review', ids);
        return json({ success: true, action, count: ids.length });
      }
      case 'reject_reviews': {
        await db
          .update(reviews)
          .set({ approved: false })
          .where(inArray(reviews.id, ids));
        await logAction(session!.userId, 'bulk_reject', 'review', ids);
        return json({ success: true, action, count: ids.length });
      }
      case 'delete_reviews': {
        await db.delete(reviews).where(inArray(reviews.id, ids));
        await logAction(session!.userId, 'bulk_delete', 'review', ids);
        return json({ success: true, action, count: ids.length });
      }

      // ── Leads ──
      case 'export_leads': {
        const leadData = await db
          .select()
          .from(leads)
          .where(inArray(leads.id, ids));
        await logAction(session!.userId, 'bulk_export', 'lead', ids);
        return json({ success: true, action, data: leadData });
      }
      case 'delete_leads': {
        await db.delete(leads).where(inArray(leads.id, ids));
        await logAction(session!.userId, 'bulk_delete', 'lead', ids);
        return json({ success: true, action, count: ids.length });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error('Bulk action error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
