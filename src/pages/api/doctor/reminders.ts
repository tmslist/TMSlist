import type { APIRoute } from 'astro';
import { and, eq, lte, desc, gt } from 'drizzle-orm';
import { db } from '../../../db';
import { leadReminders, leads, clinics, doctors, users } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth.js';
import { sendReviewRequestEmail } from '../../../utils/reviewCollection';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

async function resolveDoctorUserId(session: ReturnType<typeof getSessionFromRequest>) {
  if (!session) return null;
  if (hasRole(session, 'admin')) return session.userId;
  const userRows = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!userRows[0]?.clinicId) return null;
  const docRows = await db.select().from(doctors).where(eq(doctors.clinicId, userRows[0].clinicId)).limit(1);
  return docRows[0] ? session.userId : null;
}

/**
 * GET /api/doctor/reminders?filter=due|upcoming|all
 * Returns lead reminders associated with this doctor's user, joined with lead context.
 */
export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  const userId = await resolveDoctorUserId(session);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  const filter = url.searchParams.get('filter') || 'due';
  const now = new Date();

  try {
    const baseConds = [eq(leadReminders.userId, userId), eq(leadReminders.isCompleted, false)];
    const conds = filter === 'due'
      ? [...baseConds, lte(leadReminders.reminderAt, now)]
      : filter === 'upcoming'
        ? [...baseConds, gt(leadReminders.reminderAt, now)]
        : baseConds;

    const rows = await db
      .select({
        id: leadReminders.id,
        leadId: leadReminders.leadId,
        reminderAt: leadReminders.reminderAt,
        message: leadReminders.message,
        isCompleted: leadReminders.isCompleted,
        createdAt: leadReminders.createdAt,
        leadName: leads.name,
        leadEmail: leads.email,
        leadPhone: leads.phone,
      })
      .from(leadReminders)
      .leftJoin(leads, eq(leadReminders.leadId, leads.id))
      .where(and(...conds))
      .orderBy(desc(leadReminders.reminderAt))
      .limit(50);

    return json({ reminders: rows });
  } catch (err) {
    console.error('reminders GET error', err);
    return json({ error: 'Failed to load' }, 500);
  }
};

/**
 * POST /api/doctor/reminders?id=...&action=send-review
 * On-demand review-request send via Resend. Marks the reminder complete on success.
 */
export const POST: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  const userId = await resolveDoctorUserId(session);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  const id = url.searchParams.get('id');
  const action = url.searchParams.get('action');
  if (!id || action !== 'send-review') return json({ error: 'id and action=send-review required' }, 400);

  try {
    const rows = await db
      .select({
        reminderId: leadReminders.id,
        leadId: leadReminders.leadId,
        completed: leadReminders.isCompleted,
        ownerUserId: leadReminders.userId,
        patientName: leads.name,
        patientEmail: leads.email,
        clinicId: leads.clinicId,
        clinicName: clinics.name,
        clinicSlug: clinics.slug,
      })
      .from(leadReminders)
      .leftJoin(leads, eq(leadReminders.leadId, leads.id))
      .leftJoin(clinics, eq(leads.clinicId, clinics.id))
      .where(eq(leadReminders.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return json({ error: 'reminder not found' }, 404);

    // Authorization: own the reminder OR be admin (admin already passed via resolveDoctorUserId).
    const isAdmin = hasRole(session, 'admin');
    if (!isAdmin && row.ownerUserId !== userId) return json({ error: 'Forbidden' }, 403);

    if (!row.patientEmail) return json({ error: 'No patient email on file' }, 400);
    if (!row.clinicName || !row.clinicSlug) return json({ error: 'No clinic linked to this lead' }, 400);

    const ok = await sendReviewRequestEmail({
      patientName: row.patientName || 'there',
      patientEmail: row.patientEmail,
      clinicName: row.clinicName,
      clinicSlug: row.clinicSlug,
    });

    if (!ok) return json({ error: 'Email send failed (check RESEND_API_KEY)' }, 502);

    await db.update(leadReminders).set({ isCompleted: true }).where(eq(leadReminders.id, id));

    // Annotate the lead with send history.
    const leadRows = await db.select().from(leads).where(eq(leads.id, row.leadId)).limit(1);
    const prevMeta = (leadRows[0]?.metadata && typeof leadRows[0].metadata === 'object'
      ? leadRows[0].metadata
      : {}) as Record<string, unknown>;
    const sentList = Array.isArray(prevMeta.reviewRequestSentAt) ? [...prevMeta.reviewRequestSentAt] : [];
    sentList.push(new Date().toISOString());
    await db.update(leads).set({ metadata: { ...prevMeta, reviewRequestSentAt: sentList } }).where(eq(leads.id, row.leadId));

    return json({ ok: true, sentTo: row.patientEmail });
  } catch (err) {
    console.error('[reminders] send-review error', err);
    return json({ error: 'Failed to send' }, 500);
  }
};

/**
 * PATCH /api/doctor/reminders?id=...   body: { isCompleted?: boolean }
 */
export const PATCH: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  const userId = await resolveDoctorUserId(session);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);

  try {
    const body = await request.json();
    const { isCompleted } = body as { isCompleted?: boolean };
    const updated = await db
      .update(leadReminders)
      .set({ isCompleted: !!isCompleted })
      .where(and(eq(leadReminders.id, id), eq(leadReminders.userId, userId)))
      .returning();
    if (!updated[0]) return json({ error: 'not found' }, 404);
    return json(updated[0]);
  } catch (err) {
    console.error('reminders PATCH error', err);
    return json({ error: 'Failed to update' }, 500);
  }
};
