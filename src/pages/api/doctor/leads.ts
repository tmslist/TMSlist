import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { db } from '../..//../db/index.js';
import { doctors, leads, leadReminders, users, auditLog } from '../../../db/schema';
import { eq, desc, or, like } from 'drizzle-orm';

const ALLOWED_STATUSES = new Set(['new', 'contacted', 'qualified', 'converted', 'closed', 'spam']);

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

async function verifyDoctorAccess(session: Awaited<ReturnType<typeof getSessionFromRequest>>) {
  if (!session) return null;
  if (hasRole(session, 'admin')) return { isAdmin: true, userId: session.userId };

  const userRows = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  const user = userRows[0];
  if (!user || !user.clinicId) return null;

  const doctorRows = await db.select().from(doctors).where(eq(doctors.clinicId, user.clinicId)).limit(1);
  if (doctorRows[0]) return { isAdmin: false, userId: session.userId, doctorId: doctorRows[0].id, doctor: doctorRows[0] };
  return null;
}

async function logAudit(userId: string, action: string, entityType: string, entityId?: string, details?: Record<string, unknown>) {
  try {
    await db.insert(auditLog).values({ userId, action, entityType, entityId, details });
  } catch (err) {
    console.error('[audit] Failed to log:', err);
  }
}

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  const doctorCtx = await verifyDoctorAccess(session);
  if (!doctorCtx) return json({ error: 'Unauthorized' }, 401);

  try {
    let doctorName: string | null = null;
    let doctorId: string | null = null;

    if ('doctor' in doctorCtx && doctorCtx.doctor) {
      doctorName = doctorCtx.doctor.name;
      doctorId = doctorCtx.doctor.id;
    } else if ('doctorId' in doctorCtx) {
      doctorId = doctorCtx.doctorId;
      const docRows = await db.select().from(doctors).where(eq(doctors.id, doctorId)).limit(1);
      doctorName = docRows[0]?.name ?? null;
    }

    // Find leads referencing this doctor via doctorName field
    // or via metadata.doctorId
    let doctorLeads;
    if (doctorName) {
      doctorLeads = await db.select().from(leads)
        .where(or(
          like(leads.doctorName, `%${doctorName}%`),
          eq(leads.doctorName, doctorName)
        ))
        .orderBy(desc(leads.createdAt));
    } else {
      doctorLeads = [];
    }

    // Also get leads with doctorId in metadata
    const metaLeads = await db.select().from(leads)
      .orderBy(desc(leads.createdAt))
      .limit(100); // Filter in application

    // Combine and deduplicate
    const allLeads = [...doctorLeads];
    const seenIds = new Set(allLeads.map(l => l.id));
    for (const lead of metaLeads) {
      if (!seenIds.has(lead.id) && lead.metadata && typeof lead.metadata === 'object' && 'doctorId' in lead.metadata) {
        const metaDoctorId = (lead.metadata as Record<string, unknown>).doctorId;
        if (metaDoctorId === doctorId) {
          allLeads.push(lead);
          seenIds.add(lead.id);
        }
      }
    }

    return json({ leads: allLeads });
  } catch (err) {
    console.error('Doctor leads GET error:', err);
    return json({ error: 'Failed to load leads' }, 500);
  }
};

/**
 * PATCH /api/doctor/leads?id=...
 * Update lead status / contact metadata. Stores in leads.metadata since the
 * leads table has no status column.
 *   body: { status?: 'new'|'contacted'|...; markFirstResponse?: boolean; note?: string }
 */
export const PATCH: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  const doctorCtx = await verifyDoctorAccess(session);
  if (!doctorCtx) return json({ error: 'Unauthorized' }, 401);

  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);

  try {
    const body = await request.json();
    const { status, markFirstResponse, note } = body as {
      status?: string; markFirstResponse?: boolean; note?: string;
    };

    if (status && !ALLOWED_STATUSES.has(status)) return json({ error: 'invalid status' }, 400);

    const existing = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
    const lead = existing[0];
    if (!lead) return json({ error: 'lead not found' }, 404);

    const prevMeta = (lead.metadata && typeof lead.metadata === 'object' ? lead.metadata : {}) as Record<string, unknown>;
    const now = new Date().toISOString();
    const nextMeta: Record<string, unknown> = {
      ...prevMeta,
      ...(status ? { status, lastStatusChangeAt: now } : {}),
      ...(markFirstResponse && !prevMeta.firstResponseAt ? { firstResponseAt: now } : {}),
      ...(status === 'contacted' || markFirstResponse ? { lastContactedAt: now } : {}),
      ...(note ? { lastNote: note, lastNoteAt: now } : {}),
    };

    // When a lead transitions to 'converted', schedule review-request reminders
    // at T+7d and T+21d. Idempotent — only fires when previous status differed
    // and we haven't already scheduled them.
    const becomingConverted = status === 'converted' && prevMeta.status !== 'converted';
    if (becomingConverted && !prevMeta.reviewRequestsScheduled) {
      const day = 24 * 60 * 60 * 1000;
      const sevenDays = new Date(Date.now() + 7 * day);
      const twentyOneDays = new Date(Date.now() + 21 * day);
      try {
        await db.insert(leadReminders).values([
          {
            leadId: id,
            userId: doctorCtx.userId,
            reminderAt: sevenDays,
            message: `Send review request to ${lead.name || lead.email || 'patient'} (T+7d)`,
            isCompleted: false,
          },
          {
            leadId: id,
            userId: doctorCtx.userId,
            reminderAt: twentyOneDays,
            message: `Follow-up review request (T+21d) — only if no review yet`,
            isCompleted: false,
          },
        ]);
        nextMeta.reviewRequestsScheduled = now;
        nextMeta.reviewRequestsAt = [sevenDays.toISOString(), twentyOneDays.toISOString()];
      } catch (err) {
        console.error('[review-request] Failed to schedule:', err);
      }
    }

    const updated = await db.update(leads).set({ metadata: nextMeta }).where(eq(leads.id, id)).returning();
    await logAudit(doctorCtx.userId, 'update', 'lead', id, { status, markFirstResponse });
    return json(updated[0]);
  } catch (err) {
    console.error('Doctor leads PATCH error:', err);
    return json({ error: 'Failed to update lead' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  const doctorCtx = await verifyDoctorAccess(session);
  if (!doctorCtx) return json({ error: 'Unauthorized' }, 401);

  try {
    const body = await request.json();
    const { leadId, remindAt, note } = body;

    if (!leadId || !remindAt) return json({ error: 'leadId and remindAt are required' }, 400);

    let doctorId: string | null = null;
    if ('doctorId' in doctorCtx) doctorId = doctorCtx.doctorId;

    const remindAtDate = new Date(remindAt);
    if (isNaN(remindAtDate.getTime())) return json({ error: 'Invalid remindAt date' }, 400);

    const result = await db.insert(leadReminders).values({
      leadId,
      userId: doctorCtx.userId,
      reminderAt: remindAtDate,
      message: note ?? null,
      isCompleted: false,
    }).returning();

    await logAudit(doctorCtx.userId, 'create', 'lead_reminder', result[0].id, { leadId });
    return json(result[0], 201);
  } catch (err) {
    console.error('Doctor leads POST error:', err);
    return json({ error: 'Failed to create reminder' }, 500);
  }
};
