import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../../db';
import { jobs } from '../../../../db/schema';
import { jobSubmitSchema } from '../../../../db/validation';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth';

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

  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) return json({ error: 'Job not found' }, 404);
  if (job.clinicId !== session.clinicId) return json({ error: 'Forbidden' }, 403);

  return json({ data: job });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'clinic_owner')) return json({ error: 'Unauthorized' }, 401);

  const { id } = params;
  if (!id) return json({ error: 'Missing job ID' }, 400);

  const [existing] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!existing) return json({ error: 'Job not found' }, 404);
  if (existing.clinicId !== session.clinicId) return json({ error: 'Forbidden' }, 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const parsed = jobSubmitSchema.partial().safeParse(body);
  if (!parsed.success) {
    return json({ error: 'Validation failed', details: parsed.error.flatten() }, 422);
  }

  const data = parsed.data;
  const updateFields: Record<string, unknown> = {};
  if (data.title !== undefined) updateFields.title = data.title;
  if (data.roleCategory !== undefined) updateFields.roleCategory = data.roleCategory;
  if (data.employmentType !== undefined) updateFields.employmentType = data.employmentType;
  if (data.location !== undefined) updateFields.location = data.location;
  if (data.remote !== undefined) updateFields.remote = data.remote;
  if (data.salaryMin !== undefined) updateFields.salaryMin = data.salaryMin;
  if (data.salaryMax !== undefined) updateFields.salaryMax = data.salaryMax;
  if (data.salaryDisplay !== undefined) updateFields.salaryDisplay = data.salaryDisplay;
  if (data.description !== undefined) updateFields.description = data.description;
  if (data.requirements !== undefined) updateFields.requirements = data.requirements;
  if (data.responsibilities !== undefined) updateFields.responsibilities = data.responsibilities;
  if (data.benefits !== undefined) updateFields.benefits = data.benefits;
  if (data.applicationEmail !== undefined) updateFields.applicationEmail = data.applicationEmail;
  if (data.applicationUrl !== undefined) updateFields.applicationUrl = data.applicationUrl;
  if (data.status !== undefined) updateFields.status = data.status;
  if (data.expiresAt !== undefined) updateFields.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;

  const [updated] = await db
    .update(jobs)
    .set(updateFields)
    .where(eq(jobs.id, id))
    .returning({ id: jobs.id });

  return json({ success: true, id: updated.id });
};

export const DELETE: APIRoute = async ({ params, request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'clinic_owner')) return json({ error: 'Unauthorized' }, 401);

  const { id } = params;
  if (!id) return json({ error: 'Missing job ID' }, 400);

  const [existing] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!existing) return json({ error: 'Job not found' }, 404);
  if (existing.clinicId !== session.clinicId) return json({ error: 'Forbidden' }, 403);

  await db.delete(jobs).where(eq(jobs.id, id));
  return json({ success: true });
};
