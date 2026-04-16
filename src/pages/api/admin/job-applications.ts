import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { db } from '../../../db';
import { jobApplications, jobs, clinics, users } from '../../../db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '50'), 200));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));
    const statusFilter = url.searchParams.get('status') || undefined;
    const clinicFilter = url.searchParams.get('clinicId') || undefined;

    let query = db
      .select({
        id: jobApplications.id,
        applicantName: jobApplications.applicantName,
        applicantEmail: jobApplications.applicantEmail,
        applicantPhone: jobApplications.applicantPhone,
        resumeUrl: jobApplications.resumeUrl,
        coverLetter: jobApplications.coverLetter,
        linkedInUrl: jobApplications.linkedInUrl,
        status: jobApplications.status,
        notes: jobApplications.notes,
        createdAt: jobApplications.createdAt,
        jobId: jobApplications.jobId,
        clinicId: jobApplications.clinicId,
        jobTitle: jobs.title,
        jobRoleCategory: jobs.roleCategory,
        clinicName: clinics.name,
        clinicCity: clinics.city,
        clinicState: clinics.state,
      })
      .from(jobApplications)
      .leftJoin(jobs, eq(jobApplications.jobId, jobs.id))
      .leftJoin(clinics, eq(jobApplications.clinicId, clinics.id))
      .orderBy(desc(jobApplications.createdAt))
      .limit(limit)
      .offset(offset);

    // Build where conditions if filters present
    const conditions = [];
    if (statusFilter) conditions.push(eq(jobApplications.status, statusFilter as 'new' | 'viewed' | 'contacted' | 'rejected' | 'hired'));
    if (clinicFilter) conditions.push(eq(jobApplications.clinicId, clinicFilter));

    const data = conditions.length > 0
      ? await query.where(conditions.length === 1 ? conditions[0] : sql.join(conditions, sql` AND `))
      : await query;

    // Get stats
    const [totalCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobApplications);

    const [newCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobApplications)
      .where(eq(jobApplications.status, 'new'));

    return json({
      data,
      stats: {
        total: Number(totalCount?.count) || 0,
        new: Number(newCount?.count) || 0,
      },
    });
  } catch (err) {
    console.error('[GET /api/admin/job-applications]', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id) return json({ error: 'Application ID is required' }, 400);

    const updates: Record<string, string> = {};
    if (status && ['new', 'viewed', 'contacted', 'rejected', 'hired'].includes(status)) {
      updates.status = status;
    }
    if (notes !== undefined) {
      updates.notes = notes;
    }

    if (Object.keys(updates).length === 0) {
      return json({ error: 'No valid updates provided' }, 400);
    }

    await db
      .update(jobApplications)
      .set(updates)
      .where(eq(jobApplications.id, id));

    return json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/admin/job-applications]', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized — admin only' }, 401);
  }

  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return json({ error: 'ids array is required' }, 400);
    }

    await db.delete(jobApplications).where(
      sql`${jobApplications.id} = ANY(${ids})`
    );

    return json({ success: true, deleted: ids.length });
  } catch (err) {
    console.error('[DELETE /api/admin/job-applications]', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
