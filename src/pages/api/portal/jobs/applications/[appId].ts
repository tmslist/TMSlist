import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../../../db';
import { jobApplications, jobs } from '../../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const PUT: APIRoute = async ({ params, request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'clinic_owner')) return json({ error: 'Unauthorized' }, 401);

  const { appId } = params;
  if (!appId) return json({ error: 'Missing application ID' }, 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { status, notes } = body as { status?: string; notes?: string };
  if (!status || !['new', 'viewed', 'contacted', 'rejected', 'hired'].includes(status)) {
    return json({ error: 'Invalid status' }, 422);
  }

  // Verify ownership via job
  const [application] = await db
    .select({ jobId: jobApplications.jobId, clinicId: jobApplications.clinicId })
    .from(jobApplications)
    .where(eq(jobApplications.id, appId))
    .limit(1);

  if (!application) return json({ error: 'Application not found' }, 404);

  const [job] = await db.select({ clinicId: jobs.clinicId }).from(jobs).where(eq(jobs.id, application.jobId)).limit(1);
  if (!job || job.clinicId !== session.clinicId) return json({ error: 'Forbidden' }, 403);

  const [updated] = await db
    .update(jobApplications)
    .set({ status: status as any, notes: notes ?? application.notes })
    .where(eq(jobApplications.id, appId))
    .returning({ id: jobApplications.id });

  return json({ success: true, id: updated.id });
};
