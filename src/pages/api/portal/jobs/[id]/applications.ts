import type { APIRoute } from 'astro';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../../../../db';
import { jobs, jobApplications } from '../../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ params, request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'clinic_owner')) return json({ error: 'Unauthorized' }, 401);

  const { id } = params;
  if (!id) return json({ error: 'Missing job ID' }, 400);

  // Verify ownership
  const [job] = await db.select({ clinicId: jobs.clinicId }).from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) return json({ error: 'Job not found' }, 404);
  if (job.clinicId !== session.clinicId) return json({ error: 'Forbidden' }, 403);

  const applications = await db
    .select()
    .from(jobApplications)
    .where(eq(jobApplications.jobId, id))
    .orderBy(desc(jobApplications.createdAt));

  // Mark all as viewed
  const unread = applications.filter((a) => a.status === 'new');
  if (unread.length > 0) {
    await db
      .update(jobApplications)
      .set({ status: 'viewed' })
      .where(eq(jobApplications.jobId, id));
  }

  return json({ data: applications });
};
